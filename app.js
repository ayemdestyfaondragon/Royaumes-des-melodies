const STORAGE_KEY = "royaumes_melodies_v6";
const ROOM_META_KEY = "royaumes_room_system_v1";
const metaCache = {};
let loadSeq = 0;

let broadcastChannel = null;
let roomPollTimer = null;
let firebasePollTimer = null;

let state = {
  mode: "local", // "local" | "remote"
  roomCode: "",
  remotePseudo: "",
  players: [
    { id: 1, name: "Joueur 1", score: 0 },
    { id: 2, name: "Joueur 2", score: 0 }
  ],
  nextPlayerId: 3,
  roundNumber: 0,
  currentTrackId: null,
  revealed: false,
  playedIds: [],
  buzzes: []
};

let roomSystem = {
  clientId: "",
  roomName: "Salon Royal Disney",
  hostId: "",
  firebaseBaseUrl: "",
  members: [],
  messages: [],
  updatedAt: 0
};

try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  if (saved && Array.isArray(saved.players) && saved.players.length) {
    state = { ...state, ...saved };
  }
} catch (_) {}

try {
  const savedRoomSys = JSON.parse(localStorage.getItem(ROOM_META_KEY) || "null");
  if (savedRoomSys && typeof savedRoomSys === "object") {
    roomSystem = { ...roomSystem, ...savedRoomSys };
  }
} catch (_) {}

if (!roomSystem.clientId) {
  roomSystem.clientId = "cli_" + Math.random().toString(36).slice(2, 10);
}

const urlParams = new URLSearchParams(window.location.search);
const initialRoomParam = (urlParams.get("room") || "").trim().toUpperCase();
if (initialRoomParam) {
  state.mode = "remote";
  state.roomCode = initialRoomParam;
}

const tabLocal = document.getElementById("tabLocal");
const tabRemote = document.getElementById("tabRemote");
const remoteBox = document.getElementById("remoteBox");
const syncStatus = document.getElementById("syncStatus");
const roomCodeBadge = document.getElementById("roomCodeBadge");
const roomRolePill = document.getElementById("roomRolePill");
const roomConnectionBadge = document.getElementById("roomConnectionBadge");
const toggleReadyBtn = document.getElementById("toggleReadyBtn");
const leaveRoomBtn = document.getElementById("leaveRoomBtn");
const remotePseudoInput = document.getElementById("remotePseudoInput");
const roomNameInput = document.getElementById("roomNameInput");
const createRoomBtn = document.getElementById("createRoomBtn");
const joinRoomInput = document.getElementById("joinRoomInput");
const joinRoomBtn = document.getElementById("joinRoomBtn");
const copyInviteBtn = document.getElementById("copyInviteBtn");
const roomTitleDisplay = document.getElementById("roomTitleDisplay");
const roomCountLabel = document.getElementById("roomCountLabel");
const roomRosterList = document.getElementById("roomRosterList");
const roomChatLog = document.getElementById("roomChatLog");
const roomChatForm = document.getElementById("roomChatForm");
const roomChatInput = document.getElementById("roomChatInput");
const firebaseUrlInput = document.getElementById("firebaseUrlInput");
const saveFirebaseBtn = document.getElementById("saveFirebaseBtn");

const buzzPanel = document.getElementById("buzzPanel");
const buzzBtn = document.getElementById("buzzBtn");
const clearBuzzBtn = document.getElementById("clearBuzzBtn");
const buzzLeaderText = document.getElementById("buzzLeaderText");
const buzzFeed = document.getElementById("buzzFeed");

const playerNameInput = document.getElementById("playerNameInput");
const addPlayerBtn = document.getElementById("addPlayerBtn");
const resetScoresBtn = document.getElementById("resetScoresBtn");
const playersGrid = document.getElementById("playersGrid");

const roundBadge = document.getElementById("roundBadge");
const randomRoundBtn = document.getElementById("randomRoundBtn");
const revealBtn = document.getElementById("revealBtn");
const coverWrap = document.getElementById("coverWrap");
const coverImg = document.getElementById("coverImg");
const mysteryOverlay = document.getElementById("mysteryOverlay");
const stageTitle = document.getElementById("stageTitle");
const stageSub = document.getElementById("stageSub");

const audioEl = document.getElementById("audioEl");
const playPauseBtn = document.getElementById("playPauseBtn");
const seekBar = document.getElementById("seekBar");
const currentTimeLabel = document.getElementById("currentTimeLabel");
const durationLabel = document.getElementById("durationLabel");
const volumeBar = document.getElementById("volumeBar");
const audioStatus = document.getElementById("audioStatus");
const sourceTag = document.getElementById("sourceTag");
const fallbackBox = document.getElementById("fallbackBox");
const ytFallbackLink = document.getElementById("ytFallbackLink");

const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");
const resetPlayedBtn = document.getElementById("resetPlayedBtn");
const countLabel = document.getElementById("countLabel");
const playedLabel = document.getElementById("playedLabel");
const tracksList = document.getElementById("tracksList");

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function roomStorageKey(code) {
  return `royaumes_room_${String(code || "").toUpperCase()}`;
}

function normalizeFirebaseBase(raw) {
  const trimmed = String(raw || "").trim().replace(/\/+$/, "");
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) return "";
  return trimmed;
}

function isCurrentUserHost() {
  if (!state.roomCode || !roomSystem.hostId) return true;
  return roomSystem.hostId === roomSystem.clientId;
}

function currentPseudo() {
  const typed = remotePseudoInput ? remotePseudoInput.value.trim() : "";
  if (typed) {
    state.remotePseudo = typed;
  }
  if (!state.remotePseudo) {
    state.remotePseudo = "Joueur_" + roomSystem.clientId.slice(-4);
  }
  return state.remotePseudo;
}

function ensurePlayerForPseudo(pseudo) {
  const clean = String(pseudo || "").trim();
  if (!clean) return;
  const exists = state.players.some((p) => p.name.toLowerCase() === clean.toLowerCase());
  if (!exists) {
    state.players.push({ id: state.nextPlayerId++, name: clean, score: 0 });
  }
}

function appendRoomSystemMessage(text) {
  roomSystem.messages.push({
    id: "m_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
    sender: "Système",
    text,
    ts: Date.now(),
    system: true
  });
  if (roomSystem.messages.length > 60) {
    roomSystem.messages = roomSystem.messages.slice(-60);
  }
}

function upsertSelfInRoom(options = {}) {
  if (!state.roomCode) return;
  const pseudo = currentPseudo();
  if (!roomSystem.hostId && options.asHost) {
    roomSystem.hostId = roomSystem.clientId;
  }
  const existing = roomSystem.members.find((m) => m.clientId === roomSystem.clientId);
  if (existing) {
    existing.pseudo = pseudo;
    if (typeof options.ready === "boolean") {
      existing.ready = options.ready;
    }
  } else {
    roomSystem.members.push({
      clientId: roomSystem.clientId,
      pseudo,
      ready: Boolean(options.ready),
      joinedAt: Date.now(),
      isHost: roomSystem.hostId === roomSystem.clientId
    });
  }
  roomSystem.members.forEach((m) => {
    m.isHost = m.clientId === roomSystem.hostId;
  });
  ensurePlayerForPseudo(pseudo);
}

function buildFullRoomSnapshot() {
  return {
    roomCode: state.roomCode,
    roomName: roomSystem.roomName || `Room ${state.roomCode}`,
    hostId: roomSystem.hostId || roomSystem.clientId,
    members: roomSystem.members,
    messages: roomSystem.messages,
    players: state.players,
    nextPlayerId: state.nextPlayerId,
    roundNumber: state.roundNumber,
    currentTrackId: state.currentTrackId,
    revealed: state.revealed,
    playedIds: state.playedIds,
    buzzes: state.buzzes,
    updatedAt: Date.now()
  };
}

async function pushSnapshotToFirebase(snapshot) {
  const base = normalizeFirebaseBase(roomSystem.firebaseBaseUrl);
  if (!base || !snapshot || !snapshot.roomCode) return;
  const endpoint = `${base}/royaumes_rooms/${encodeURIComponent(snapshot.roomCode)}.json`;
  try {
    await fetch(endpoint, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snapshot)
    });
  } catch (_) {}
}

async function pullSnapshotFromFirebase() {
  const base = normalizeFirebaseBase(roomSystem.firebaseBaseUrl);
  if (!base || !state.roomCode) return null;
  const endpoint = `${base}/royaumes_rooms/${encodeURIComponent(state.roomCode)}.json`;
  try {
    const res = await fetch(endpoint, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch (_) {
    return null;
  }
}

function saveState(options = {}) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    localStorage.setItem(ROOM_META_KEY, JSON.stringify(roomSystem));
  } catch (_) {}

  if (state.mode === "remote" && state.roomCode && !options.skipBroadcast) {
    const snap = buildFullRoomSnapshot();
    try {
      localStorage.setItem(roomStorageKey(state.roomCode), JSON.stringify(snap));
    } catch (_) {}
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: "ROOM_SYNC", payload: snap });
    }
    pushSnapshotToFirebase(snap);
  }
}

function renderRoomPanel() {
  if (!roomRolePill) return;
  const hostMode = isCurrentUserHost();
  roomRolePill.textContent = hostMode ? "👑 Hôte de la room" : "👤 Joueur connecté";
  roomRolePill.className = hostMode ? "room-role-pill host" : "room-role-pill";

  const fbActive = Boolean(normalizeFirebaseBase(roomSystem.firebaseBaseUrl));
  if (roomConnectionBadge) {
    roomConnectionBadge.textContent = fbActive
      ? "• Synchro Firebase active"
      : "• Canal local / multi-onglets";
  }

  const selfMember = roomSystem.members.find((m) => m.clientId === roomSystem.clientId);
  if (toggleReadyBtn) {
    const isReady = Boolean(selfMember && selfMember.ready);
    toggleReadyBtn.textContent = isReady ? "✅ Prêt !" : "⏳ Se mettre prêt";
  }

  if (roomTitleDisplay) {
    roomTitleDisplay.textContent = state.roomCode
      ? `${roomSystem.roomName || "Room"} (${state.roomCode})`
      : "Aucune room active";
  }
  if (roomCountLabel) {
    roomCountLabel.textContent = `${roomSystem.members.length} joueur(s)`;
  }

  if (roomRosterList) {
    if (!roomSystem.members.length) {
      roomRosterList.innerHTML = `<div class="sync-note">Crée ou rejoins une room pour voir les joueurs connectés.</div>`;
    } else {
      roomRosterList.innerHTML = roomSystem.members
        .map((m) => {
          const canPromote = hostMode && m.clientId !== roomSystem.clientId;
          return `
            <div class="roster-item">
              <span>${escapeHtml(m.pseudo)}</span>
              <span class="roster-badges">
                ${m.isHost ? `<span class="mini-tag host">👑 Hôte</span>` : `<span class="mini-tag">Joueur</span>`}
                <span class="mini-tag ${m.ready ? "ready" : "not-ready"}">${m.ready ? "Prêt" : "En attente"}</span>
                ${canPromote ? `<button type="button" class="ghost" style="padding:0.2rem 0.45rem;font-size:0.72rem;" onclick="promoteToHost('${escapeHtml(m.clientId)}')">Passer hôte</button>` : ""}
              </span>
            </div>
          `;
        })
        .join("");
    }
  }

  if (roomChatLog) {
    if (!roomSystem.messages.length) {
      roomChatLog.innerHTML = `<div class="sync-note">Aucun message dans la room pour l'instant.</div>`;
    } else {
      roomChatLog.innerHTML = roomSystem.messages
        .map((msg) => {
          if (msg.system) {
            return `<div class="room-msg system">${escapeHtml(msg.text)}</div>`;
          }
          return `<div class="room-msg"><strong>${escapeHtml(msg.sender)} :</strong> ${escapeHtml(msg.text)}</div>`;
        })
        .join("");
      roomChatLog.scrollTop = roomChatLog.scrollHeight;
    }
  }
}

window.promoteToHost = function (targetClientId) {
  if (!isCurrentUserHost()) return;
  roomSystem.hostId = targetClientId;
  roomSystem.members.forEach((m) => {
    m.isHost = m.clientId === roomSystem.hostId;
  });
  const target = roomSystem.members.find((m) => m.clientId === targetClientId);
  appendRoomSystemMessage(`${target ? target.pseudo : "Un joueur"} est maintenant hôte de la room.`);
  saveState();
  renderRoomPanel();
  if (typeof renderRoundGuesses === 'function') renderRoundGuesses();
};

function renderBuzzUI() {
  if (!buzzPanel) return;
  if (state.mode !== "remote") {
    buzzPanel.style.display = "none";
    return;
  }
  buzzPanel.style.display = "flex";
  buzzBtn.disabled = !state.currentTrackId;

  if (!state.buzzes.length) {
    buzzLeaderText.textContent = "Aucun buzz pour l'instant sur cette manche.";
    buzzFeed.innerHTML = "";
    return;
  }

  const first = state.buzzes[0];
  buzzLeaderText.textContent = `🏆 Premier buzz : ${first.pseudo} (${first.label})`;
  buzzFeed.innerHTML = state.buzzes
    .map(
      (b, idx) =>
        `<span class="buzz-chip ${idx === 0 ? "first" : ""}">#${idx + 1} ${escapeHtml(b.pseudo)} • ${escapeHtml(b.label)}</span>`
    )
    .join("");
}

function applyRemotePayload(payload) {
  if (!payload || payload.roomCode !== state.roomCode) return;
  if ((payload.updatedAt || 0) <= (roomSystem.updatedAt || 0) && payload.updatedAt !== 0) {
    // Allow initial sync even if timestamps match
  }

  const trackChanged = payload.currentTrackId && payload.currentTrackId !== state.currentTrackId;
  const revealChanged = payload.revealed !== state.revealed;

  if (payload.roomName) roomSystem.roomName = payload.roomName;
  if (payload.hostId) roomSystem.hostId = payload.hostId;
  if (Array.isArray(payload.members)) roomSystem.members = payload.members;
  if (Array.isArray(payload.messages)) roomSystem.messages = payload.messages;
  if (payload.updatedAt) roomSystem.updatedAt = payload.updatedAt;

  state.players = Array.isArray(payload.players) && payload.players.length ? payload.players : state.players;
  state.nextPlayerId = payload.nextPlayerId || state.nextPlayerId;
  state.roundNumber = payload.roundNumber ?? state.roundNumber;
  state.currentTrackId = payload.currentTrackId ?? state.currentTrackId;
  state.revealed = Boolean(payload.revealed);
  state.playedIds = Array.isArray(payload.playedIds) ? payload.playedIds : state.playedIds;
  state.buzzes = Array.isArray(payload.buzzes) ? payload.buzzes : [];

  saveState({ skipBroadcast: true });
  renderPlayers();
  renderList();
  renderBuzzUI();
  renderRoomPanel();

  const currentTrack = DISNEY_TRACKS.find((t) => t.id === state.currentTrackId);
  if (currentTrack) {
    roundBadge.textContent = `Manche #${state.roundNumber} • Piste #${currentTrack.id}`;
    if (trackChanged) {
      loadAndPlayTrack(currentTrack, { fromRemoteSync: true });
    } else if (revealChanged) {
      updateStageRevealUI(currentTrack);
    }
  }
}

function startRoomListeners() {
  if (broadcastChannel) {
    broadcastChannel.close();
    broadcastChannel = null;
  }
  if (roomPollTimer) {
    clearInterval(roomPollTimer);
    roomPollTimer = null;
  }
  if (firebasePollTimer) {
    clearInterval(firebasePollTimer);
    firebasePollTimer = null;
  }

  if (state.mode !== "remote" || !state.roomCode) return;

  if ("BroadcastChannel" in window) {
    broadcastChannel = new BroadcastChannel(`royaumes_${state.roomCode}`);
    broadcastChannel.onmessage = (event) => {
      if (event.data && event.data.type === "ROOM_SYNC") {
        applyRemotePayload(event.data.payload);
      }
    };
  }

  roomPollTimer = setInterval(() => {
    try {
      const raw = localStorage.getItem(roomStorageKey(state.roomCode));
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.updatedAt && parsed.updatedAt > roomSystem.updatedAt) {
        applyRemotePayload(parsed);
      }
    } catch (_) {}
  }, 800);

  if (normalizeFirebaseBase(roomSystem.firebaseBaseUrl)) {
    firebasePollTimer = setInterval(async () => {
      if (state.mode === "remote" && state.roomCode) {
        const snap = await pullSnapshotFromFirebase();
        if (snap && snap.updatedAt && snap.updatedAt > roomSystem.updatedAt) {
          applyRemotePayload(snap);
        }
      }
    }, 1600);
  }
}

function setMode(newMode) {
  state.mode = newMode;
  if (newMode === "remote") {
    if (!state.roomCode) {
      state.roomCode = generateRoomCode();
      roomSystem.hostId = roomSystem.clientId;
      roomSystem.roomName = (roomNameInput && roomNameInput.value.trim()) || `Room ${state.roomCode}`;
      roomSystem.members = [];
      roomSystem.messages = [];
      upsertSelfInRoom({ asHost: true, ready: true });
      appendRoomSystemMessage(`${currentPseudo()} a ouvert la room "${roomSystem.roomName}".`);
    } else {
      upsertSelfInRoom({ asHost: !roomSystem.hostId, ready: false });
    }
    tabLocal.classList.remove("active");
    tabRemote.classList.add("active");
    remoteBox.style.display = "flex";
    roomCodeBadge.textContent = `ROOM : ${state.roomCode}`;
    syncStatus.textContent = `Mode Multi • Room ${state.roomCode}`;
    startRoomListeners();
    saveState();
  } else {
    tabRemote.classList.remove("active");
    tabLocal.classList.add("active");
    remoteBox.style.display = "none";
    syncStatus.textContent = "Mode Local actif";
    if (roomPollTimer) {
      clearInterval(roomPollTimer);
      roomPollTimer = null;
    }
    if (firebasePollTimer) {
      clearInterval(firebasePollTimer);
      firebasePollTimer = null;
    }
    saveState({ skipBroadcast: true });
  }
  renderPlayers();
  renderBuzzUI();
  renderRoomPanel();
}

tabLocal.addEventListener("click", () => setMode("local"));
tabRemote.addEventListener("click", () => setMode("remote"));

createRoomBtn.addEventListener("click", () => {
  state.mode = "remote";
  tabLocal.classList.remove("active");
  tabRemote.classList.add("active");
  remoteBox.style.display = "flex";

  state.roomCode = generateRoomCode();
  const customName = (roomNameInput && roomNameInput.value.trim()) || "";
  roomSystem.roomName = customName || `Room ${state.roomCode}`;
  roomSystem.hostId = roomSystem.clientId;
  roomSystem.members = [];
  roomSystem.messages = [];
  roomSystem.updatedAt = Date.now();

  upsertSelfInRoom({ asHost: true, ready: true });
  appendRoomSystemMessage(`${currentPseudo()} a créé la room "${roomSystem.roomName}".`);

  roomCodeBadge.textContent = `ROOM : ${state.roomCode}`;
  syncStatus.textContent = `Mode Multi • Room ${state.roomCode}`;
  startRoomListeners();
  saveState();
  renderPlayers();
  renderBuzzUI();
  renderRoomPanel();
});

joinRoomBtn.addEventListener("click", async () => {
  const code = joinRoomInput.value.trim().toUpperCase();
  if (!code) return;

  state.mode = "remote";
  tabLocal.classList.remove("active");
  tabRemote.classList.add("active");
  remoteBox.style.display = "flex";

  state.roomCode = code;
  roomCodeBadge.textContent = `ROOM : ${state.roomCode}`;
  syncStatus.textContent = `Mode Multi • Room ${state.roomCode}`;
  startRoomListeners();

  let loaded = null;
  try {
    loaded = JSON.parse(localStorage.getItem(roomStorageKey(code)) || "null");
  } catch (_) {}

  const fbSnap = await pullSnapshotFromFirebase();
  if (fbSnap && (!loaded || (fbSnap.updatedAt || 0) > (loaded.updatedAt || 0))) {
    loaded = fbSnap;
  }

  if (loaded) {
    applyRemotePayload(loaded);
  } else {
    roomSystem.hostId = roomSystem.clientId;
    roomSystem.roomName = `Room ${code}`;
  }

  upsertSelfInRoom({ asHost: !roomSystem.hostId, ready: false });
  appendRoomSystemMessage(`${currentPseudo()} a rejoint la room.`);
  roomSystem.updatedAt = Date.now();
  saveState();
  renderPlayers();
  renderBuzzUI();
  renderRoomPanel();
});

copyInviteBtn.addEventListener("click", async () => {
  if (!state.roomCode) return;
  const baseUrl = window.location.href.split("?")[0];
  const inviteUrl = `${baseUrl}?room=${encodeURIComponent(state.roomCode)}`;
  try {
    await navigator.clipboard.writeText(inviteUrl);
    syncStatus.textContent = `Lien d'invitation copié (${state.roomCode}) !`;
  } catch (_) {
    syncStatus.textContent = `Code room : ${state.roomCode}`;
  }
});

if (toggleReadyBtn) {
  toggleReadyBtn.addEventListener("click", () => {
    if (!state.roomCode) return;
    upsertSelfInRoom();
    const me = roomSystem.members.find((m) => m.clientId === roomSystem.clientId);
    if (me) {
      me.ready = !me.ready;
      appendRoomSystemMessage(`${me.pseudo} est ${me.ready ? "prêt" : "en attente"}.`);
    }
    roomSystem.updatedAt = Date.now();
    saveState();
    renderRoomPanel();
  });
}

if (leaveRoomBtn) {
  leaveRoomBtn.addEventListener("click", () => {
    if (!state.roomCode) return;
    const pseudo = currentPseudo();
    appendRoomSystemMessage(`${pseudo} a quitté la room.`);
    roomSystem.members = roomSystem.members.filter((m) => m.clientId !== roomSystem.clientId);
    if (roomSystem.hostId === roomSystem.clientId && roomSystem.members.length > 0) {
      roomSystem.hostId = roomSystem.members[0].clientId;
      roomSystem.members.forEach((m) => {
        m.isHost = m.clientId === roomSystem.hostId;
      });
      appendRoomSystemMessage(`${roomSystem.members[0].pseudo} devient le nouvel hôte.`);
    }
    roomSystem.updatedAt = Date.now();
    saveState();

    state.roomCode = "";
    roomCodeBadge.textContent = "ROOM : ------";
    syncStatus.textContent = "Mode Multi • Hors room";
    saveState({ skipBroadcast: true });
    renderRoomPanel();
  });
}

if (roomChatForm) {
  roomChatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!state.roomCode) return;
    const text = (roomChatInput && roomChatInput.value.trim()) || "";
    if (!text) return;
    upsertSelfInRoom();
    roomSystem.messages.push({
      id: "msg_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      sender: currentPseudo(),
      text,
      ts: Date.now(),
      system: false
    });
    if (roomSystem.messages.length > 60) {
      roomSystem.messages = roomSystem.messages.slice(-60);
    }
    roomChatInput.value = "";
    roomSystem.updatedAt = Date.now();
    saveState();
    renderRoomPanel();
  });
}

if (saveFirebaseBtn) {
  saveFirebaseBtn.addEventListener("click", async () => {
    const clean = normalizeFirebaseBase(firebaseUrlInput && firebaseUrlInput.value);
    roomSystem.firebaseBaseUrl = clean;
    saveState({ skipBroadcast: true });
    startRoomListeners();
    renderRoomPanel();
    if (clean && state.roomCode) {
      const remoteSnap = await pullSnapshotFromFirebase();
      if (remoteSnap && (remoteSnap.updatedAt || 0) > (roomSystem.updatedAt || 0)) {
        applyRemotePayload(remoteSnap);
      } else {
        roomSystem.updatedAt = Date.now();
        saveState();
      }
    }
  });
}

buzzBtn.addEventListener("click", () => {
  if (!state.currentTrackId) return;
  const pseudo = currentPseudo();
  ensurePlayerForPseudo(pseudo);

  const now = new Date();
  const label = `${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}.${String(Math.floor(now.getMilliseconds() / 10)).padStart(2, "0")}`;

  if (!state.buzzes.some((b) => b.pseudo.toLowerCase() === pseudo.toLowerCase())) {
    state.buzzes.push({ pseudo, at: Date.now(), label });
  }
  roomSystem.updatedAt = Date.now();
  saveState();
  renderPlayers();
  renderBuzzUI();
});

clearBuzzBtn.addEventListener("click", () => {
  state.buzzes = [];
  roomSystem.updatedAt = Date.now();
  saveState();
  renderBuzzUI();
});

function makeFallbackArtwork(track) {
  const title = encodeURIComponent(String(track.film || "Disney").slice(0, 26));
  const year = encodeURIComponent(String(track.annee || 2026));
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='#1e1b4b'/>
        <stop offset='50%' stop-color='#312e81'/>
        <stop offset='100%' stop-color='#0f172a'/>
      </linearGradient>
    </defs>
    <rect width='400' height='400' fill='url(#g)'/>
    <circle cx='200' cy='165' r='68' fill='none' stroke='#f59e0b' stroke-width='4' opacity='0.85'/>
    <text x='200' y='182' text-anchor='middle' font-size='54' fill='#fde68a' font-family='sans-serif'>♪</text>
    <text x='200' y='282' text-anchor='middle' font-size='21' font-weight='bold' fill='#f8fafc' font-family='sans-serif'>${title}</text>
    <text x='200' y='314' text-anchor='middle' font-size='16' fill='#94a3b8' font-family='sans-serif'>Disney • ${year}</text>
  </svg>`;
  return "data:image/svg+xml;utf8," + svg;
}

function jsonpRequest(url, callbackParam = "callback", timeoutMs = 4500) {
  return new Promise((resolve) => {
    const cbName = "__jsonp_cb_" + Math.random().toString(36).slice(2);
    const script = document.createElement("script");
    let done = false;

    const cleanup = () => {
      if (done) return;
      done = true;
      delete window[cbName];
      if (script.parentNode) script.parentNode.removeChild(script);
    };

    const timer = setTimeout(() => {
      cleanup();
      resolve(null);
    }, timeoutMs);

    window[cbName] = (data) => {
      clearTimeout(timer);
      cleanup();
      resolve(data);
    };

    const sep = url.includes("?") ? "&" : "?";
    script.src = `${url}${sep}${callbackParam}=${cbName}`;
    script.onerror = () => {
      clearTimeout(timer);
      cleanup();
      resolve(null);
    };
    document.head.appendChild(script);
  });
}

async function searchItunesJsonp(query, country = "FR") {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&country=${country}&media=music&entity=song&limit=5`;
  const data = await jsonpRequest(url, "callback");
  if (data && Array.isArray(data.results) && data.results.length > 0) {
    const match = data.results.find((r) => r.previewUrl) || data.results[0];
    if (match && match.previewUrl) {
      return {
        audioUrl: match.previewUrl,
        artworkUrl: match.artworkUrl100 ? match.artworkUrl100.replace("100x100bb", "500x500bb") : "",
        source: `Apple Music (${country})`
      };
    }
  }
  return null;
}

async function searchDeezerJsonp(query) {
  const url = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=5&output=jsonp`;
  const data = await jsonpRequest(url, "callback");
  if (data && Array.isArray(data.data) && data.data.length > 0) {
    const match = data.data.find((r) => r.preview) || data.data[0];
    if (match && match.preview) {
      const cover = (match.album && (match.album.cover_big || match.album.cover_medium)) || "";
      return {
        audioUrl: match.preview,
        artworkUrl: cover,
        source: "Deezer"
      };
    }
  }
  return null;
}

async function fetchTrackMedia(track) {
  if (metaCache[track.id] && metaCache[track.id].audioUrl) {
    return metaCache[track.id];
  }

  const attempts = [
    () => searchDeezerJsonp(`${track.titre_fr} ${track.film}`),
    () => searchItunesJsonp(`${track.titre_fr} ${track.film}`, "FR"),
    () => searchDeezerJsonp(`${track.titre_en} Disney`),
    () => searchItunesJsonp(`${track.titre_en} ${track.film}`, "US")
  ];

  for (const run of attempts) {
    const res = await run();
    if (res && res.audioUrl) {
      const media = {
        audioUrl: res.audioUrl,
        artworkUrl: res.artworkUrl || makeFallbackArtwork(track),
        source: res.source
      };
      metaCache[track.id] = media;
      return media;
    }
  }

  const fallback = {
    audioUrl: "",
    artworkUrl: makeFallbackArtwork(track),
    source: "Indisponible"
  };
  metaCache[track.id] = fallback;
  return fallback;
}

window.addPoints = function (playerId, delta) {
  const p = state.players.find((pl) => pl.id === playerId);
  if (!p) return;
  p.score = Math.max(0, p.score + delta);
  roomSystem.updatedAt = Date.now();
  saveState();
  renderPlayers();
};

window.removePlayer = function (playerId) {
  if (state.players.length <= 1) return;
  state.players = state.players.filter((pl) => pl.id !== playerId);
  roomSystem.updatedAt = Date.now();
  saveState();
  renderPlayers();
};

function renderPlayers() {
  playersGrid.innerHTML = state.players
    .map(
      (p) => `
      <div class="player-card">
        <div class="player-top">
          <span class="player-name">${escapeHtml(p.name)}</span>
          <span class="player-pts">${p.score} pt${p.score > 1 ? "s" : ""}</span>
        </div>
        <div class="pt-actions">
          <button type="button" class="btn-title" onclick="addPoints(${p.id}, 1)">+1 Titre</button>
          <button type="button" class="btn-film" onclick="addPoints(${p.id}, 1)">+1 Disney</button>
          <button type="button" class="btn-both" onclick="addPoints(${p.id}, 2)">+2 Les 2</button>
          <button type="button" class="btn-minus" onclick="addPoints(${p.id}, -1)">-1</button>
          ${state.players.length > 1 ? `<button type="button" class="btn-minus" onclick="removePlayer(${p.id})" title="Supprimer">✕</button>` : ""}
        </div>
      </div>
    `
    )
    .join("");
}

function formatTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function updateStageRevealUI(track) {
  if (!track) return;
  if (state.revealed) {
    coverWrap.classList.remove("mystery");
    mysteryOverlay.style.display = "none";
    stageTitle.textContent = `${track.titre_fr} (${track.titre_en})`;
    stageSub.textContent = `Disney : ${track.film} (${track.annee}) • ${track.type}`;
    revealBtn.textContent = "🙈 Masquer réponse";
  } else {
    coverWrap.classList.add("mystery");
    mysteryOverlay.style.display = "flex";
    stageTitle.textContent = "Manche en cours — Quel est ce morceau ?";
    stageSub.textContent = "1 pt pour le titre • 1 pt pour le Disney";
    revealBtn.textContent = "👁️ Révéler réponse";
  }
}

async function loadAndPlayTrack(track, options = {}) {
  if (!track) return;
  const mySeq = ++loadSeq;
  const fromRemoteSync = Boolean(options.fromRemoteSync);

  if (!fromRemoteSync) {
    state.roundNumber += 1;
    state.currentTrackId = track.id;
    state.revealed = false;
    state.buzzes = [];
    if (!state.playedIds.includes(track.id)) {
      state.playedIds.push(track.id);
    }
    roomSystem.updatedAt = Date.now();
    saveState();
  }

  renderList();
  renderBuzzUI();

  roundBadge.textContent = `Manche #${state.roundNumber} • Piste #${track.id}`;
  coverImg.src = makeFallbackArtwork(track);
  updateStageRevealUI(track);

  audioEl.pause();
  audioEl.removeAttribute("src");
  audioEl.load();

  seekBar.value = 0;
  seekBar.disabled = true;
  playPauseBtn.disabled = true;
  playPauseBtn.textContent = "▶";
  currentTimeLabel.textContent = "0:00";
  durationLabel.textContent = "0:30";
  fallbackBox.style.display = "none";
  ytFallbackLink.href = track.yt_fallback;
  sourceTag.textContent = "Recherche...";
  audioStatus.textContent = "Recherche de l'extrait audio et de la pochette...";

  const media = await fetchTrackMedia(track);
  if (mySeq !== loadSeq) return;

  coverImg.src = media.artworkUrl;
  sourceTag.textContent = media.source;

  const thumbEl = document.getElementById(`thumb-${track.id}`);
  if (thumbEl) thumbEl.src = media.artworkUrl;

  if (!media.audioUrl) {
    audioStatus.textContent = "Aucun extrait audio trouvé pour ce morceau.";
    fallbackBox.style.display = "block";
    return;
  }

  audioEl.src = media.audioUrl;
  audioEl.volume = Number(volumeBar.value);
  playPauseBtn.disabled = false;
  seekBar.disabled = false;

  try {
    await audioEl.play();
    if (mySeq !== loadSeq) return;
    playPauseBtn.textContent = "⏸";
    audioStatus.textContent = "Lecture en cours...";
  } catch (_) {
    if (mySeq !== loadSeq) return;
    playPauseBtn.textContent = "▶";
    audioStatus.textContent = "Prêt — Appuie sur ▶ pour lancer le son.";
  }
}

window.playTrackById = function (id) {
  const track = DISNEY_TRACKS.find((t) => t.id === id);
  if (track) loadAndPlayTrack(track);
};

playPauseBtn.addEventListener("click", async () => {
  if (!audioEl.src) return;
  if (audioEl.paused) {
    try {
      await audioEl.play();
      playPauseBtn.textContent = "⏸";
      audioStatus.textContent = "Lecture en cours...";
    } catch (_) {
      audioStatus.textContent = "Impossible de lire ce flux audio.";
      fallbackBox.style.display = "block";
    }
  } else {
    audioEl.pause();
    playPauseBtn.textContent = "▶";
    audioStatus.textContent = "En pause";
  }
});

audioEl.addEventListener("error", () => {
  playPauseBtn.textContent = "▶";
  audioStatus.textContent = "Erreur de chargement du flux audio.";
  fallbackBox.style.display = "block";
});

audioEl.addEventListener("loadedmetadata", () => {
  durationLabel.textContent = formatTime(audioEl.duration);
});

audioEl.addEventListener("timeupdate", () => {
  if (audioEl.duration) {
    seekBar.value = (audioEl.currentTime / audioEl.duration) * 100;
    currentTimeLabel.textContent = formatTime(audioEl.currentTime);
    durationLabel.textContent = formatTime(audioEl.duration);
  }
});

audioEl.addEventListener("ended", () => {
  playPauseBtn.textContent = "▶";
  audioStatus.textContent = "Extrait terminé — Révèle la réponse ou relance !";
});

seekBar.addEventListener("input", () => {
  if (audioEl.duration) {
    audioEl.currentTime = (seekBar.value / 100) * audioEl.duration;
  }
});

volumeBar.addEventListener("input", () => {
  audioEl.volume = Number(volumeBar.value);
});
audioEl.volume = 0.9;

randomRoundBtn.addEventListener("click", () => {
  const filtered = getFilteredTracks();
  const unplayed = filtered.filter((t) => !state.playedIds.includes(t.id));
  const pool = unplayed.length ? unplayed : filtered;
  if (!pool.length) return;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  loadAndPlayTrack(chosen);
});

revealBtn.addEventListener("click", () => {
  const track = DISNEY_TRACKS.find((t) => t.id === state.currentTrackId);
  if (!track) return;
  state.revealed = !state.revealed;
  roomSystem.updatedAt = Date.now();
  saveState();
  updateStageRevealUI(track);
});

function getFilteredTracks() {
  const q = searchInput.value.trim().toLowerCase();
  const t = typeFilter.value;
  return DISNEY_TRACKS.filter((item) => {
    const okType = t === "ALL" || item.type === t;
    const okQuery =
      !q ||
      item.titre_fr.toLowerCase().includes(q) ||
      item.titre_en.toLowerCase().includes(q) ||
      item.film.toLowerCase().includes(q) ||
      String(item.annee).includes(q);
    return okType && okQuery;
  });
}

const artworkObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      const id = Number(img.dataset.trackId);
      artworkObserver.unobserve(img);
      const track = DISNEY_TRACKS.find((t) => t.id === id);
      if (!track) return;
      fetchTrackMedia(track).then((media) => {
        if (media && media.artworkUrl) {
          img.src = media.artworkUrl;
        }
      });
    });
  },
  { rootMargin: "150px" }
);

function renderList() {
  const list = getFilteredTracks();
  countLabel.textContent = `${list.length} morceau(x) affiché(s) sur ${DISNEY_TRACKS.length}`;
  playedLabel.textContent = `${state.playedIds.length} / ${DISNEY_TRACKS.length} joué(s)`;

  tracksList.innerHTML = list
    .map((track) => {
      const isPlayed = state.playedIds.includes(track.id);
      const isCurrent = state.currentTrackId === track.id;
      const cachedArt = metaCache[track.id]?.artworkUrl || makeFallbackArtwork(track);
      return `
        <article class="track-card ${isCurrent ? "active" : ""}">
          <div class="track-left">
            <img
              id="thumb-${track.id}"
              class="thumb"
              src="${cachedArt}"
              data-track-id="${track.id}"
              alt="${escapeHtml(track.film)}"
              loading="lazy"
            />
            <div class="track-info">
              <div class="track-title">
                #${track.id} — ${escapeHtml(track.titre_fr)}
                <span class="track-en">(${escapeHtml(track.titre_en)})</span>
                ${isPlayed ? `<span class="badge-played">Joué</span>` : ""}
              </div>
              <div class="track-sub">${escapeHtml(track.film)} (${track.annee}) • ${escapeHtml(track.type)}</div>
            </div>
          </div>
          <button type="button" onclick="playTrackById(${track.id})">▶ Jouer</button>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll(".thumb").forEach((img) => {
    const id = Number(img.dataset.trackId);
    if (!metaCache[id]) {
      artworkObserver.observe(img);
    }
  });
}

addPlayerBtn.addEventListener("click", () => {
  const name = playerNameInput.value.trim();
  if (!name) return;
  state.players.push({ id: state.nextPlayerId++, name, score: 0 });
  playerNameInput.value = "";
  roomSystem.updatedAt = Date.now();
  saveState();
  renderPlayers();
});

playerNameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addPlayerBtn.click();
});

resetScoresBtn.addEventListener("click", () => {
  state.players.forEach((p) => (p.score = 0));
  roomSystem.updatedAt = Date.now();
  saveState();
  renderPlayers();
});

resetPlayedBtn.addEventListener("click", () => {
  state.playedIds = [];
  state.roundNumber = 0;
  roomSystem.updatedAt = Date.now();
  saveState();
  renderList();
});

searchInput.addEventListener("input", renderList);
typeFilter.addEventListener("change", renderList);

if (state.remotePseudo && remotePseudoInput) {
  remotePseudoInput.value = state.remotePseudo;
}
if (roomNameInput && roomSystem.roomName) {
  roomNameInput.value = roomSystem.roomName;
}
if (firebaseUrlInput && roomSystem.firebaseBaseUrl) {
  firebaseUrlInput.value = roomSystem.firebaseBaseUrl;
}
if (state.roomCode && roomCodeBadge) {
  roomCodeBadge.textContent = `ROOM : ${state.roomCode}`;
}

coverImg.src = makeFallbackArtwork({ film: "Royaumes des Mélodies", annee: 2026 });
setMode(state.mode === "remote" ? "remote" : "local");
renderPlayers();
renderList();
renderBuzzUI();
renderRoomPanel();


// =========================================================
// ONGLET RÉPONSE (TITRE + DISNEY + POINTS + HISTORIQUE MANCHE)
// =========================================================
const tabGuessAnswer = document.getElementById("tabGuessAnswer");
const tabRoundFeed = document.getElementById("tabRoundFeed");
const guessFormView = document.getElementById("guessFormView");
const roundFeedView = document.getElementById("roundFeedView");
const guessAnswerForm = document.getElementById("guessAnswerForm");
const guessTitleInput = document.getElementById("guessTitleInput");
const guessFilmInput = document.getElementById("guessFilmInput");
const guessFeedback = document.getElementById("guessFeedback");
const roundAnswersList = document.getElementById("roundAnswersList");

if (!Array.isArray(state.roundGuesses)) {
  state.roundGuesses = [];
}

function normalizeAnswer(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isTitleMatch(inputVal, track) {
  const clean = normalizeAnswer(inputVal);
  if (!clean) return false;
  const fr = normalizeAnswer(track.titre_fr);
  const en = normalizeAnswer(track.titre_en);
  return (
    clean === fr ||
    clean === en ||
    (clean.length >= 4 && (fr.includes(clean) || en.includes(clean)))
  );
}

function isFilmMatch(inputVal, track) {
  const clean = normalizeAnswer(inputVal);
  if (!clean) return false;
  const film = normalizeAnswer(track.film);
  const filmNoParen = normalizeAnswer(String(track.film || "").replace(/\([^)]*\)/g, ""));
  return (
    clean === film ||
    clean === filmNoParen ||
    (clean.length >= 3 && (film.includes(clean) || filmNoParen.includes(clean)))
  );
}

function renderRoundGuesses() {
  if (!roundAnswersList) return;
  if (!state.roundGuesses.length) {
    roundAnswersList.innerHTML = `<div class="sync-note">Aucune proposition enregistrée sur cette manche pour l'instant.</div>`;
    return;
  }
  roundAnswersList.innerHTML = state.roundGuesses
    .map(
      (g) => `
      <div class="round-answer-item">
        <span>
          <strong>${escapeHtml(g.playerName)}</strong> :
          Titre « ${escapeHtml(g.titleGuess || "—")} » • Disney « ${escapeHtml(g.filmGuess || "—")} »
        </span>
        <span class="mini-tag ${g.pointsEarned > 0 ? "ready" : "not-ready"}">+${g.pointsEarned} pt(s)</span>
      </div>
    `
    )
    .join("");
}

if (tabGuessAnswer && tabRoundFeed) {
  tabGuessAnswer.addEventListener("click", () => {
    tabGuessAnswer.classList.add("active");
    tabRoundFeed.classList.remove("active");
    guessFormView.style.display = "block";
    roundFeedView.style.display = "none";
  });

  tabRoundFeed.addEventListener("click", () => {
    tabRoundFeed.classList.add("active");
    tabGuessAnswer.classList.remove("active");
    roundFeedView.style.display = "block";
    guessFormView.style.display = "none";
    renderRoundGuesses();
  });
}

if (guessAnswerForm) {
  guessAnswerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const track = DISNEY_TRACKS.find((t) => t.id === state.currentTrackId);
    if (!track) {
      if (guessFeedback) {
        guessFeedback.className = "guess-feedback";
        guessFeedback.textContent = "Lance d'abord une manche pour proposer un titre et un Disney.";
      }
      return;
    }

    const titleVal = (guessTitleInput && guessTitleInput.value.trim()) || "";
    const filmVal = (guessFilmInput && guessFilmInput.value.trim()) || "";
    if (!titleVal && !filmVal) {
      if (guessFeedback) {
        guessFeedback.className = "guess-feedback";
        guessFeedback.textContent = "Écris au moins le titre ou le Disney avant de valider.";
      }
      return;
    }

    const activePlayerName =
      state.mode === "remote"
        ? currentPseudo()
        : (state.players[0] && state.players[0].name) || "Joueur 1";

    ensurePlayerForPseudo(activePlayerName);
    const targetPlayer =
      state.players.find((p) => p.name.toLowerCase() === activePlayerName.toLowerCase()) ||
      state.players[0];

    const titleOk = isTitleMatch(titleVal, track);
    const filmOk = isFilmMatch(filmVal, track);
    const earned = (titleOk ? 1 : 0) + (filmOk ? 1 : 0);

    if (targetPlayer && earned > 0) {
      targetPlayer.score += earned;
    }

    state.roundGuesses.push({
      playerName: activePlayerName,
      titleGuess: titleVal,
      filmGuess: filmVal,
      titleOk,
      filmOk,
      pointsEarned: earned,
      ts: Date.now()
    });

    if (earned === 2) {
      state.revealed = true;
      updateStageRevealUI(track);
      if (guessFeedback) {
        guessFeedback.className = "guess-feedback ok";
        guessFeedback.textContent = `🎉 Parfait ! ${activePlayerName} trouve le titre ET le Disney (+2 pts) : ${track.titre_fr} — ${track.film}.`;
      }
    } else if (titleOk) {
      if (guessFeedback) {
        guessFeedback.className = "guess-feedback partial";
        guessFeedback.textContent = `🎵 Titre exact (+1 pt) pour ${activePlayerName} ! Quel est le Disney ?`;
      }
    } else if (filmOk) {
      if (guessFeedback) {
        guessFeedback.className = "guess-feedback partial";
        guessFeedback.textContent = `🎬 Disney exact (+1 pt) pour ${activePlayerName} ! Quel est le titre de la chanson ?`;
      }
    } else {
      if (guessFeedback) {
        guessFeedback.className = "guess-feedback";
        guessFeedback.textContent = `❌ Pas tout à fait pour ${activePlayerName} (+0 pt). Essaie encore ou révèle la réponse !`;
      }
    }

    if (guessTitleInput) guessTitleInput.value = "";
    if (guessFilmInput) guessFilmInput.value = "";

    roomSystem.updatedAt = Date.now();
    saveState();
    renderPlayers();
    renderRoundGuesses();
  });
}

const origLoadAndPlayTrackForGuesses = loadAndPlayTrack;
loadAndPlayTrack = async function (track, options = {}) {
  if (!options.fromRemoteSync) {
    state.roundGuesses = [];
    if (guessFeedback) {
      guessFeedback.className = "guess-feedback";
      guessFeedback.textContent = "";
    }
  }
  await origLoadAndPlayTrackForGuesses(track, options);
  renderRoundGuesses();
};

const origApplyRemotePayloadForGuesses = applyRemotePayload;
applyRemotePayload = function (payload) {
  if (payload && Array.isArray(payload.roundGuesses)) {
    state.roundGuesses = payload.roundGuesses;
  }
  origApplyRemotePayloadForGuesses(payload);
  renderRoundGuesses();
};

const origBuildFullRoomSnapshotForGuesses = buildFullRoomSnapshot;
buildFullRoomSnapshot = function () {
  const snap = origBuildFullRoomSnapshotForGuesses();
  snap.roundGuesses = state.roundGuesses || [];
  return snap;
};

renderRoundGuesses();


// =========================================================
// SYNCHRO INTER-APPAREILS FIREBASE RTDB (URL AUTO + TEST + RÈGLES)
// =========================================================
const firebaseStatusPill = document.getElementById("firebaseStatusPill");
const copyFirebaseRulesBtn = document.getElementById("copyFirebaseRulesBtn");
const clearFirebaseBtn = document.getElementById("clearFirebaseBtn");
const firebaseDiagMsg = document.getElementById("firebaseDiagMsg");

const RECOMMENDED_FIREBASE_RULES = JSON.stringify(
  {
    rules: {
      royaumes_rooms: {
        $roomCode: {
          ".read": true,
          ".write": true
        }
      }
    }
  },
  null,
  2
);

function setFirebaseStatus(mode, label, detail = "") {
  if (firebaseStatusPill) {
    firebaseStatusPill.className = "fb-status-pill" + (mode ? ` ${mode}` : "");
    firebaseStatusPill.textContent = label;
  }
  if (firebaseDiagMsg && detail) {
    firebaseDiagMsg.textContent = detail;
  }
}

function smartNormalizeFirebaseUrl(raw) {
  let val = String(raw || "").trim();
  if (!val) return "";

  // Strip trailing slashes and any /royaumes_rooms... path if user pasted a deeper URL
  val = val.replace(/\/+$/, "");
  val = val.replace(/\/royaumes_rooms(?:\/.*)?$/i, "");

  // If user pasted a Firebase Console URL like https://console.firebase.google.com/project/my-app/database/...
  const consoleMatch = val.match(/console\.firebase\.google\.com\/project\/([a-z0-9-]+)/i);
  if (consoleMatch && consoleMatch[1]) {
    return `https://${consoleMatch[1]}-default-rtdb.firebaseio.com`;
  }

  // If user typed just a project id like "mon-projet-disney"
  if (!/^https?:\/\//i.test(val) && !val.includes(".")) {
    const slug = val.toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!slug) return "";
    return `https://${slug}-default-rtdb.firebaseio.com`;
  }

  if (!/^https?:\/\//i.test(val)) {
    val = "https://" + val;
  }

  try {
    const parsed = new URL(val);
    return `${parsed.protocol}//${parsed.host}`.replace(/\/+$/, "");
  } catch (_) {
    return "";
  }
}

// Override normalizeFirebaseBase used by existing sync functions
normalizeFirebaseBase = function (raw) {
  return smartNormalizeFirebaseUrl(raw);
};

async function testAndConnectFirebase(rawInput) {
  const cleanUrl = smartNormalizeFirebaseUrl(rawInput);
  if (!cleanUrl) {
    roomSystem.firebaseBaseUrl = "";
    saveState({ skipBroadcast: true });
    startRoomListeners();
    setFirebaseStatus(
      "error",
      "⚠ URL invalide",
      "Colle une URL du type https://ton-projet-default-rtdb.firebaseio.com/ (ou l'ID de ton projet Firebase)."
    );
    renderRoomPanel();
    return false;
  }

  roomSystem.firebaseBaseUrl = cleanUrl;
  if (firebaseUrlInput) {
    firebaseUrlInput.value = cleanUrl + "/";
  }
  saveState({ skipBroadcast: true });
  startRoomListeners();

  setFirebaseStatus("", "⏳ Test connexion...", `Test de liaison avec ${cleanUrl}...`);

  const testCode = state.roomCode || "PINGTEST";
  const endpoint = `${cleanUrl}/royaumes_rooms/${encodeURIComponent(testCode)}.json`;

  try {
    if (state.roomCode) {
      const snap = buildFullRoomSnapshot();
      const putRes = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snap)
      });
      if (!putRes.ok) {
        throw new Error(`HTTP ${putRes.status}`);
      }
      const remoteSnap = await pullSnapshotFromFirebase();
      if (remoteSnap && (remoteSnap.updatedAt || 0) > (roomSystem.updatedAt || 0)) {
        applyRemotePayload(remoteSnap);
      }
    } else {
      const getRes = await fetch(endpoint, { cache: "no-store" });
      if (!getRes.ok) {
        throw new Error(`HTTP ${getRes.status}`);
      }
    }

    setFirebaseStatus(
      "connected",
      "🟢 Connecté",
      `Synchronisation inter-appareils active sur ${cleanUrl} (room ${state.roomCode || "en attente"}).`
    );
    renderRoomPanel();
    return true;
  } catch (err) {
    setFirebaseStatus(
      "error",
      "🔴 Accès refusé / hors ligne",
      `Impossible d'écrire/lire sur ${cleanUrl} (${err && err.message ? err.message : "erreur réseau"}). Vérifie que la Realtime Database est créée et que les règles autorisent .read/.write sur royaumes_rooms.`
    );
    renderRoomPanel();
    return false;
  }
}

if (saveFirebaseBtn) {
  // Replace previous listener cleanly by cloning button
  const freshSaveBtn = saveFirebaseBtn.cloneNode(true);
  saveFirebaseBtn.parentNode.replaceChild(freshSaveBtn, saveFirebaseBtn);
  freshSaveBtn.addEventListener("click", async () => {
    const val = document.getElementById("firebaseUrlInput")?.value || "";
    await testAndConnectFirebase(val);
  });
}

if (copyFirebaseRulesBtn) {
  copyFirebaseRulesBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(RECOMMENDED_FIREBASE_RULES);
      setFirebaseStatus(
        "connected",
        "📋 Règles copiées",
        "Règles Firebase Realtime Database copiées dans le presse-papiers. Colle-les dans l'onglet « Règles » de ta base Firebase."
      );
    } catch (_) {
      setFirebaseStatus(
        "",
        "🛡️ Règles recommandées",
        RECOMMENDED_FIREBASE_RULES
      );
    }
  });
}

if (clearFirebaseBtn) {
  clearFirebaseBtn.addEventListener("click", () => {
    roomSystem.firebaseBaseUrl = "";
    const inputEl = document.getElementById("firebaseUrlInput");
    if (inputEl) inputEl.value = "";
    saveState({ skipBroadcast: true });
    startRoomListeners();
    setFirebaseStatus("", "⚪ Local uniquement", "Synchro Firebase désactivée (mode local / multi-onglets actif).");
    renderRoomPanel();
  });
}

// Initialize Firebase input & status indicator on load
(() => {
  const inputEl = document.getElementById("firebaseUrlInput");
  const normalized = smartNormalizeFirebaseUrl(roomSystem.firebaseBaseUrl);
  if (normalized) {
    roomSystem.firebaseBaseUrl = normalized;
    if (inputEl) inputEl.value = normalized + "/";
    setFirebaseStatus("connected", "🟢 Configuré", `Base configurée : ${normalized}`);
  } else {
    setFirebaseStatus("", "⚪ Local uniquement", "Optionnel : ajoute une URL Firebase RTDB pour synchroniser PC, téléphone et amis.");
  }
})();




// =========================================================
// VRAIE SYNCHRO MULTI-APPAREILS (PC + TÉLÉPHONE + AMIS)
// =========================================================
const DEFAULT_RELAY_BASE = "https://ntfy.sh";
let relayPollTimer = null;
let lastSeenRelayMsgId = "";

const relayStatusPill = document.getElementById("relayStatusPill");
const forceSyncNowBtn = document.getElementById("forceSyncNowBtn");
const toggleAdvancedSyncBtn = document.getElementById("toggleAdvancedSyncBtn");
const advancedSyncDrawer = document.getElementById("advancedSyncDrawer");
const firebaseDiagMsg = document.getElementById("firebaseDiagMsg");

function getRelayBaseUrl() {
  const custom = (roomSystem.firebaseBaseUrl || "").trim().replace(/\/+$/, "");
  if (custom && /^https?:\/\//i.test(custom) && !custom.includes("firebaseio.com")) {
    return custom;
  }
  return DEFAULT_RELAY_BASE;
}

function getRoomTopic(code) {
  const cleanCode = String(code || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return `royaumes-melodies-room-${cleanCode}`;
}

function setRelayBanner(modeClass, badgeText, msgText) {
  if (relayStatusPill) {
    relayStatusPill.className = "fb-status-pill" + (modeClass ? ` ${modeClass}` : "");
    relayStatusPill.textContent = badgeText;
  }
  if (firebaseDiagMsg && msgText) {
    firebaseDiagMsg.textContent = msgText;
  }
}

async function publishRoomSnapshotToRelay(snapshot) {
  if (!snapshot || !snapshot.roomCode) return;
  const base = getRelayBaseUrl();
  const topic = getRoomTopic(snapshot.roomCode);
  const url = `${base}/${encodeURIComponent(topic)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        __royaumesRoomSync: true,
        snapshot
      })
    });
    if (res.ok) {
      setRelayBanner(
        "connected",
        `🟢 Connecté • ${snapshot.roomCode}`,
        `Room ${snapshot.roomCode} synchronisée à distance (${snapshot.members ? snapshot.members.length : 0} joueur(s)).`
      );
    }
  } catch (_) {
    setRelayBanner(
      "",
      "🟡 Canal local actif",
      "Relais réseau injoignable : la synchro locale / multi-onglets reste active."
    );
  }
}

async function pullRoomSnapshotFromRelay(code) {
  const cleanCode = String(code || "").trim().toUpperCase();
  if (!cleanCode) return null;
  const base = getRelayBaseUrl();
  const topic = getRoomTopic(cleanCode);
  const url = `${base}/${encodeURIComponent(topic)}/json?poll=1&since=10m`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const rawText = await res.text();
    if (!rawText.trim()) return null;

    const lines = rawText.trim().split("\n");
    let newestSnap = null;

    for (const line of lines) {
      try {
        const evt = JSON.parse(line);
        if (evt && evt.event === "message" && typeof evt.message === "string") {
          const parsedMsg = JSON.parse(evt.message);
          if (parsedMsg && parsedMsg.__royaumesRoomSync && parsedMsg.snapshot) {
            const snap = parsedMsg.snapshot;
            if (snap.roomCode === cleanCode) {
              if (!newestSnap || (snap.updatedAt || 0) >= (newestSnap.updatedAt || 0)) {
                newestSnap = snap;
              }
            }
          }
        }
      } catch (_) {}
    }

    return newestSnap;
  } catch (_) {
    return null;
  }
}

// Hook into saveState so every room change pushes across devices as well as tabs
const baseSaveState = saveState;
saveState = function (options = {}) {
  baseSaveState(options);
  if (state.mode === "remote" && state.roomCode && !options.skipBroadcast) {
    const snap = buildFullRoomSnapshot();
    publishRoomSnapshotToRelay(snap);
  }
};

// Hook into startRoomListeners to poll the shared network room topic regularly
const baseStartRoomListeners = startRoomListeners;
startRoomListeners = function () {
  baseStartRoomListeners();
  if (relayPollTimer) {
    clearInterval(relayPollTimer);
    relayPollTimer = null;
  }
  if (state.mode !== "remote" || !state.roomCode) return;

  const pollNow = async () => {
    if (state.mode !== "remote" || !state.roomCode) return;
    const remoteSnap = await pullRoomSnapshotFromRelay(state.roomCode);
    if (remoteSnap && (remoteSnap.updatedAt || 0) > (roomSystem.updatedAt || 0)) {
      applyRemotePayload(remoteSnap);
    }
  };

  pollNow();
  relayPollTimer = setInterval(pollNow, 1500);
};

// Upgrade joinRoomBtn so joining from a phone/PC fetches the live room from the network relay immediately
if (joinRoomBtn) {
  const freshJoinBtn = joinRoomBtn.cloneNode(true);
  joinRoomBtn.parentNode.replaceChild(freshJoinBtn, joinRoomBtn);
  freshJoinBtn.addEventListener("click", async () => {
    const code = (joinRoomInput?.value || "").trim().toUpperCase();
    if (!code) return;

    state.mode = "remote";
    tabLocal.classList.remove("active");
    tabRemote.classList.add("active");
    remoteBox.style.display = "flex";

    state.roomCode = code;
    roomCodeBadge.textContent = `ROOM : ${state.roomCode}`;
    syncStatus.textContent = `Mode Multi • Room ${state.roomCode}`;
    startRoomListeners();

    let loaded = null;
    try {
      loaded = JSON.parse(localStorage.getItem(roomStorageKey(code)) || "null");
    } catch (_) {}

    const netSnap = await pullRoomSnapshotFromRelay(code);
    if (netSnap && (!loaded || (netSnap.updatedAt || 0) >= (loaded.updatedAt || 0))) {
      loaded = netSnap;
    }

    if (loaded) {
      applyRemotePayload(loaded);
    } else {
      roomSystem.hostId = roomSystem.clientId;
      roomSystem.roomName = `Room ${code}`;
    }

    upsertSelfInRoom({ asHost: !roomSystem.hostId, ready: false });
    appendRoomSystemMessage(`${currentPseudo()} a rejoint la room.`);
    roomSystem.updatedAt = Date.now();
    saveState();
    renderPlayers();
    renderBuzzUI();
    renderRoomPanel();
  });
}

// Auto-join room when opened via ?room=CODE link on a phone or another PC
(async () => {
  if (state.mode === "remote" && state.roomCode) {
    startRoomListeners();
    const netSnap = await pullRoomSnapshotFromRelay(state.roomCode);
    if (netSnap && (netSnap.updatedAt || 0) >= (roomSystem.updatedAt || 0)) {
      applyRemotePayload(netSnap);
    }
    upsertSelfInRoom({ asHost: !roomSystem.hostId, ready: false });
    appendRoomSystemMessage(`${currentPseudo()} a rejoint via le lien d'invitation.`);
    roomSystem.updatedAt = Date.now();
    saveState();
    renderPlayers();
    renderBuzzUI();
    renderRoomPanel();
  }
})();

if (forceSyncNowBtn) {
  forceSyncNowBtn.addEventListener("click", async () => {
    if (!state.roomCode) {
      createRoomBtn.click();
      return;
    }
    const netSnap = await pullRoomSnapshotFromRelay(state.roomCode);
    if (netSnap && (netSnap.updatedAt || 0) > (roomSystem.updatedAt || 0)) {
      applyRemotePayload(netSnap);
    } else {
      roomSystem.updatedAt = Date.now();
      saveState();
    }
    setRelayBanner(
      "connected",
      `🟢 Synchronisé • ${state.roomCode}`,
      `État à jour pour la room ${state.roomCode}. Partage le code ${state.roomCode} ou le lien d'invitation.`
    );
  });
}

if (toggleAdvancedSyncBtn && advancedSyncDrawer) {
  toggleAdvancedSyncBtn.addEventListener("click", () => {
    const isOpen = advancedSyncDrawer.style.display === "flex";
    advancedSyncDrawer.style.display = isOpen ? "none" : "flex";
  });
}

if (saveFirebaseBtn) {
  const cleanSaveBtn = saveFirebaseBtn.cloneNode(true);
  saveFirebaseBtn.parentNode.replaceChild(cleanSaveBtn, saveFirebaseBtn);
  cleanSaveBtn.addEventListener("click", () => {
    const raw = (document.getElementById("firebaseUrlInput")?.value || "").trim().replace(/\/+$/, "");
    roomSystem.firebaseBaseUrl = raw && /^https?:\/\//i.test(raw) ? raw : "";
    saveState({ skipBroadcast: true });
    startRoomListeners();
    setRelayBanner(
      "connected",
      "🌐 Relais mis à jour",
      `Relais actif : ${getRelayBaseUrl()}`
    );
  });
}

if (clearFirebaseBtn) {
  clearFirebaseBtn.addEventListener("click", () => {
    roomSystem.firebaseBaseUrl = "";
    const fbInput = document.getElementById("firebaseUrlInput");
    if (fbInput) fbInput.value = "";
    saveState({ skipBroadcast: true });
    startRoomListeners();
    setRelayBanner(
      "connected",
      "🌐 Relais réseau prêt",
      `Relais par défaut actif (${DEFAULT_RELAY_BASE}).`
    );
  });
}
