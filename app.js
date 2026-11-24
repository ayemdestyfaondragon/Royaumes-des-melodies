const STORAGE_KEY = "royaumes_melodies_v6";
const ROOM_META_KEY = "royaumes_room_system_v1";
const DEFAULT_RELAY_BASE = "https://ntfy.sh";
const metaCache = {};

let loadSeq = 0;
let broadcastChannel = null;
let roomPollTimer = null;
let firebasePollTimer = null;
let relayPollTimer = null;

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
  buzzes: [],
  roundGuesses: []
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
  if (saved && typeof saved === "object") {
    state = {
      ...state,
      ...saved,
      players: Array.isArray(saved.players) && saved.players.length ? saved.players : state.players,
      playedIds: Array.isArray(saved.playedIds) ? saved.playedIds : [],
      buzzes: Array.isArray(saved.buzzes) ? saved.buzzes : [],
      roundGuesses: Array.isArray(saved.roundGuesses) ? saved.roundGuesses : []
    };
  }
} catch (_) {}

try {
  const savedRoomSys = JSON.parse(localStorage.getItem(ROOM_META_KEY) || "null");
  if (savedRoomSys && typeof savedRoomSys === "object") {
    roomSystem = {
      ...roomSystem,
      ...savedRoomSys,
      members: Array.isArray(savedRoomSys.members) ? savedRoomSys.members : [],
      messages: Array.isArray(savedRoomSys.messages) ? savedRoomSys.messages : []
    };
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

// DOM Elements
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
const copyFirebaseRulesBtn = document.getElementById("copyFirebaseRulesBtn");
const clearFirebaseBtn = document.getElementById("clearFirebaseBtn");
const firebaseStatusPill = document.getElementById("firebaseStatusPill");
const relayStatusPill = document.getElementById("relayStatusPill");
const forceSyncNowBtn = document.getElementById("forceSyncNowBtn");
const toggleAdvancedSyncBtn = document.getElementById("toggleAdvancedSyncBtn");
const advancedSyncDrawer = document.getElementById("advancedSyncDrawer");
const firebaseDiagMsg = document.getElementById("firebaseDiagMsg");

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

const tabGuessAnswer = document.getElementById("tabGuessAnswer");
const tabRoundFeed = document.getElementById("tabRoundFeed");
const guessFormView = document.getElementById("guessFormView");
const roundFeedView = document.getElementById("roundFeedView");
const guessAnswerForm = document.getElementById("guessAnswerForm");
const guessTitleInput = document.getElementById("guessTitleInput");
const guessFilmInput = document.getElementById("guessFilmInput");
const guessFeedback = document.getElementById("guessFeedback");
const roundAnswersList = document.getElementById("roundAnswersList");

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

function smartNormalizeFirebaseUrl(raw) {
  let val = String(raw || "").trim();
  if (!val) return "";

  val = val.replace(/\/+$/, "");
  val = val.replace(/\/royaumes_rooms(?:\/.*)?$/i, "");

  const consoleMatch = val.match(/console\.firebase\.google\.com\/project\/([a-z0-9-]+)/i);
  if (consoleMatch && consoleMatch[1]) {
    return `https://${consoleMatch[1]}-default-rtdb.firebaseio.com`;
  }

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

function getFirebaseBase() {
  const norm = smartNormalizeFirebaseUrl(roomSystem.firebaseBaseUrl);
  if (norm && norm.includes("firebaseio.com")) {
    return norm;
  }
  return "";
}

function getRelayBaseUrl() {
  const custom = String(roomSystem.firebaseBaseUrl || "").trim().replace(/\/+$/, "");
  if (custom && /^https?:\/\//i.test(custom) && !custom.includes("firebaseio.com")) {
    return custom;
  }
  return DEFAULT_RELAY_BASE;
}

function getRoomTopic(code) {
  const cleanCode = String(code || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return `royaumes-melodies-room-${cleanCode}`;
}

function setDiagStatus(modeClass, badgeText, msgText) {
  if (relayStatusPill) {
    relayStatusPill.className = "fb-status-pill" + (modeClass ? ` ${modeClass}` : "");
    relayStatusPill.textContent = badgeText;
  }
  if (firebaseStatusPill) {
    firebaseStatusPill.className = "fb-status-pill" + (modeClass ? ` ${modeClass}` : "");
    firebaseStatusPill.textContent = badgeText;
  }
  if (firebaseDiagMsg && msgText) {
    firebaseDiagMsg.textContent = msgText;
  }
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
    roundGuesses: state.roundGuesses || [],
    updatedAt: roomSystem.updatedAt || Date.now()
  };
}

async function pushSnapshotToFirebase(snapshot) {
  const base = getFirebaseBase();
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

async function pullSnapshotFromFirebase(code = state.roomCode) {
  const base = getFirebaseBase();
  const cleanCode = String(code || "").trim().toUpperCase();
  if (!base || !cleanCode) return null;
  const endpoint = `${base}/royaumes_rooms/${encodeURIComponent(cleanCode)}.json`;
  try {
    const res = await fetch(endpoint, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch (_) {
    return null;
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
      setDiagStatus(
        "connected",
        `🟢 Connecté • ${snapshot.roomCode}`,
        `Room ${snapshot.roomCode} synchronisée (${snapshot.members ? snapshot.members.length : 0} joueur(s)).`
      );
    }
  } catch (_) {
    // Keep local / BroadcastChannel working silently without blocking UI
  }
}

async function pullRoomSnapshotFromRelay(code) {
  const cleanCode = String(code || "").trim().toUpperCase();
  if (!cleanCode) return null;
  const base = getRelayBaseUrl();
  const topic = getRoomTopic(cleanCode);
  const url = `${base}/${encodeURIComponent(topic)}/json?poll=1&since=15m`;

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

function saveState(options = {}) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    localStorage.setItem(ROOM_META_KEY, JSON.stringify(roomSystem));
  } catch (_) {}

  if (state.mode === "remote" && state.roomCode && !options.skipBroadcast) {
    if (!roomSystem.updatedAt) {
      roomSystem.updatedAt = Date.now();
    }
    const snap = buildFullRoomSnapshot();
    try {
      localStorage.setItem(roomStorageKey(state.roomCode), JSON.stringify(snap));
    } catch (_) {}
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage({ type: "ROOM_SYNC", payload: snap });
      } catch (_) {}
    }
    pushSnapshotToFirebase(snap);
    publishRoomSnapshotToRelay(snap);
  }
}

function renderRoomPanel() {
  if (!roomRolePill) return;
  const hostMode = isCurrentUserHost();
  roomRolePill.textContent = hostMode ? "👑 Hôte de la room" : "👤 Joueur connecté";
  roomRolePill.className = hostMode ? "room-role-pill host" : "room-role-pill";

  const fbActive = Boolean(getFirebaseBase());
  if (roomConnectionBadge) {
    roomConnectionBadge.textContent = fbActive
      ? "• Synchro Firebase + Réseau"
      : "• Synchro Réseau + Multi-onglets";
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
  roomSystem.updatedAt = Date.now();
  saveState();
  renderRoomPanel();
};

function renderBuzzUI() {
  if (!buzzPanel) return;
  if (state.mode !== "remote") {
    buzzPanel.style.display = "none";
    return;
  }
  buzzPanel.style.display = "flex";
  if (buzzBtn) buzzBtn.disabled = !state.currentTrackId;

  if (!state.buzzes.length) {
    if (buzzLeaderText) buzzLeaderText.textContent = "Aucun buzz pour l'instant sur cette manche.";
    if (buzzFeed) buzzFeed.innerHTML = "";
    return;
  }

  const first = state.buzzes[0];
  if (buzzLeaderText) buzzLeaderText.textContent = `🏆 Premier buzz : ${first.pseudo} (${first.label})`;
  if (buzzFeed) {
    buzzFeed.innerHTML = state.buzzes
      .map(
        (b, idx) =>
          `<span class="buzz-chip ${idx === 0 ? "first" : ""}">#${idx + 1} ${escapeHtml(b.pseudo)} • ${escapeHtml(b.label)}</span>`
      )
      .join("");
  }
}

function applyRemotePayload(payload) {
  if (!payload || payload.roomCode !== state.roomCode) return;

  const incomingTs = Number(payload.updatedAt || 0);
  const currentTs = Number(roomSystem.updatedAt || 0);
  if (incomingTs > 0 && currentTs > 0 && incomingTs < currentTs) {
    return;
  }

  const trackChanged = payload.currentTrackId && payload.currentTrackId !== state.currentTrackId;
  const revealChanged = Boolean(payload.revealed) !== Boolean(state.revealed);

  if (payload.roomName) roomSystem.roomName = payload.roomName;
  if (payload.hostId) roomSystem.hostId = payload.hostId;
  if (Array.isArray(payload.members)) roomSystem.members = payload.members;
  if (Array.isArray(payload.messages)) roomSystem.messages = payload.messages;
  if (incomingTs > 0) roomSystem.updatedAt = incomingTs;

  state.players = Array.isArray(payload.players) && payload.players.length ? payload.players : state.players;
  state.nextPlayerId = payload.nextPlayerId || state.nextPlayerId;
  state.roundNumber = payload.roundNumber ?? state.roundNumber;
  state.currentTrackId = payload.currentTrackId ?? state.currentTrackId;
  state.revealed = Boolean(payload.revealed);
  state.playedIds = Array.isArray(payload.playedIds) ? payload.playedIds : state.playedIds;
  state.buzzes = Array.isArray(payload.buzzes) ? payload.buzzes : [];
  state.roundGuesses = Array.isArray(payload.roundGuesses) ? payload.roundGuesses : state.roundGuesses;

  saveState({ skipBroadcast: true });
  renderPlayers();
  renderList();
  renderBuzzUI();
  renderRoomPanel();
  renderRoundGuesses();

  const currentTrack = DISNEY_TRACKS.find((t) => t.id === state.currentTrackId);
  if (currentTrack) {
    if (roundBadge) roundBadge.textContent = `Manche #${state.roundNumber} • Piste #${currentTrack.id}`;
    if (trackChanged) {
      loadAndPlayTrack(currentTrack, { fromRemoteSync: true });
    } else if (revealChanged) {
      updateStageRevealUI(currentTrack);
    }
  }
}

function stopRoomListeners() {
  if (broadcastChannel) {
    try { broadcastChannel.close(); } catch (_) {}
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
  if (relayPollTimer) {
    clearInterval(relayPollTimer);
    relayPollTimer = null;
  }
}

function startRoomListeners() {
  stopRoomListeners();
  if (state.mode !== "remote" || !state.roomCode) return;

  if ("BroadcastChannel" in window) {
    try {
      broadcastChannel = new BroadcastChannel(`royaumes_${state.roomCode}`);
      broadcastChannel.onmessage = (event) => {
        if (event.data && event.data.type === "ROOM_SYNC") {
          applyRemotePayload(event.data.payload);
        }
      };
    } catch (_) {}
  }

  roomPollTimer = setInterval(() => {
    try {
      const raw = localStorage.getItem(roomStorageKey(state.roomCode));
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.updatedAt || 0) > (roomSystem.updatedAt || 0)) {
        applyRemotePayload(parsed);
      }
    } catch (_) {}
  }, 800);

  if (getFirebaseBase()) {
    firebasePollTimer = setInterval(async () => {
      if (state.mode === "remote" && state.roomCode) {
        const snap = await pullSnapshotFromFirebase(state.roomCode);
        if (snap && (snap.updatedAt || 0) > (roomSystem.updatedAt || 0)) {
          applyRemotePayload(snap);
        }
      }
    }, 1600);
  }

  const pollRelay = async () => {
    if (state.mode !== "remote" || !state.roomCode) return;
    const remoteSnap = await pullRoomSnapshotFromRelay(state.roomCode);
    if (remoteSnap && (remoteSnap.updatedAt || 0) > (roomSystem.updatedAt || 0)) {
      applyRemotePayload(remoteSnap);
    }
  };
  pollRelay();
  relayPollTimer = setInterval(pollRelay, 1500);
}

function setMode(newMode) {
  state.mode = newMode === "remote" ? "remote" : "local";
  if (state.mode === "remote") {
    if (!state.roomCode) {
      state.roomCode = generateRoomCode();
      roomSystem.hostId = roomSystem.clientId;
      roomSystem.roomName = (roomNameInput && roomNameInput.value.trim()) || `Room ${state.roomCode}`;
      roomSystem.members = [];
      roomSystem.messages = [];
      roomSystem.updatedAt = Date.now();
      upsertSelfInRoom({ asHost: true, ready: true });
      appendRoomSystemMessage(`${currentPseudo()} a ouvert la room "${roomSystem.roomName}".`);
    } else {
      upsertSelfInRoom({ asHost: !roomSystem.hostId, ready: false });
    }
    if (tabLocal) tabLocal.classList.remove("active");
    if (tabRemote) tabRemote.classList.add("active");
    if (remoteBox) remoteBox.style.display = "flex";
    if (roomCodeBadge) roomCodeBadge.textContent = `ROOM : ${state.roomCode}`;
    if (syncStatus) syncStatus.textContent = `Mode Multi • Room ${state.roomCode}`;
    startRoomListeners();
    saveState();
  } else {
    if (tabRemote) tabRemote.classList.remove("active");
    if (tabLocal) tabLocal.classList.add("active");
    if (remoteBox) remoteBox.style.display = "none";
    if (syncStatus) syncStatus.textContent = "Mode Local actif";
    stopRoomListeners();
    saveState({ skipBroadcast: true });
  }
  renderPlayers();
  renderBuzzUI();
  renderRoomPanel();
}

if (tabLocal) tabLocal.addEventListener("click", () => setMode("local"));
if (tabRemote) tabRemote.addEventListener("click", () => setMode("remote"));

if (createRoomBtn) {
  createRoomBtn.addEventListener("click", () => {
    state.mode = "remote";
    if (tabLocal) tabLocal.classList.remove("active");
    if (tabRemote) tabRemote.classList.add("active");
    if (remoteBox) remoteBox.style.display = "flex";

    state.roomCode = generateRoomCode();
    const customName = (roomNameInput && roomNameInput.value.trim()) || "";
    roomSystem.roomName = customName || `Room ${state.roomCode}`;
    roomSystem.hostId = roomSystem.clientId;
    roomSystem.members = [];
    roomSystem.messages = [];
    roomSystem.updatedAt = Date.now();

    upsertSelfInRoom({ asHost: true, ready: true });
    appendRoomSystemMessage(`${currentPseudo()} a créé la room "${roomSystem.roomName}".`);

    if (roomCodeBadge) roomCodeBadge.textContent = `ROOM : ${state.roomCode}`;
    if (syncStatus) syncStatus.textContent = `Mode Multi • Room ${state.roomCode}`;
    startRoomListeners();
    saveState();
    renderPlayers();
    renderBuzzUI();
    renderRoomPanel();
  });
}

if (joinRoomBtn) {
  joinRoomBtn.addEventListener("click", async () => {
    const code = ((joinRoomInput && joinRoomInput.value) || "").trim().toUpperCase();
    if (!code) return;

    state.mode = "remote";
    if (tabLocal) tabLocal.classList.remove("active");
    if (tabRemote) tabRemote.classList.add("active");
    if (remoteBox) remoteBox.style.display = "flex";

    state.roomCode = code;
    if (roomCodeBadge) roomCodeBadge.textContent = `ROOM : ${state.roomCode}`;
    if (syncStatus) syncStatus.textContent = `Mode Multi • Room ${state.roomCode}`;
    startRoomListeners();

    let loaded = null;
    try {
      loaded = JSON.parse(localStorage.getItem(roomStorageKey(code)) || "null");
    } catch (_) {}

    const fbSnap = await pullSnapshotFromFirebase(code);
    if (fbSnap && (!loaded || (fbSnap.updatedAt || 0) >= (loaded.updatedAt || 0))) {
      loaded = fbSnap;
    }

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

if (copyInviteBtn) {
  copyInviteBtn.addEventListener("click", async () => {
    if (!state.roomCode) return;
    const baseUrl = window.location.href.split("?")[0];
    const inviteUrl = `${baseUrl}?room=${encodeURIComponent(state.roomCode)}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      if (syncStatus) syncStatus.textContent = `Lien d'invitation copié (${state.roomCode}) !`;
    } catch (_) {
      if (syncStatus) syncStatus.textContent = `Code room : ${state.roomCode}`;
    }
  });
}

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
    stopRoomListeners();
    if (roomCodeBadge) roomCodeBadge.textContent = "ROOM : ------";
    if (syncStatus) syncStatus.textContent = "Mode Multi • Hors room";
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
    if (roomChatInput) roomChatInput.value = "";
    roomSystem.updatedAt = Date.now();
    saveState();
    renderRoomPanel();
  });
}

if (forceSyncNowBtn) {
  forceSyncNowBtn.addEventListener("click", async () => {
    if (!state.roomCode && createRoomBtn) {
      createRoomBtn.click();
      return;
    }
    const netSnap = await pullRoomSnapshotFromRelay(state.roomCode);
    const fbSnap = await pullSnapshotFromFirebase(state.roomCode);
    const candidate =
      netSnap && fbSnap
        ? ((netSnap.updatedAt || 0) >= (fbSnap.updatedAt || 0) ? netSnap : fbSnap)
        : (netSnap || fbSnap);

    if (candidate && (candidate.updatedAt || 0) > (roomSystem.updatedAt || 0)) {
      applyRemotePayload(candidate);
    } else {
      roomSystem.updatedAt = Date.now();
      saveState();
    }
    setDiagStatus(
      "connected",
      `🟢 Synchronisé • ${state.roomCode}`,
      `État à jour pour la room ${state.roomCode}. Code : ${state.roomCode}.`
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
  saveFirebaseBtn.addEventListener("click", async () => {
    const raw = (firebaseUrlInput && firebaseUrlInput.value) || "";
    const norm = smartNormalizeFirebaseUrl(raw);
    roomSystem.firebaseBaseUrl = norm;
    if (firebaseUrlInput && norm) firebaseUrlInput.value = norm + "/";
    saveState({ skipBroadcast: true });
    startRoomListeners();
    renderRoomPanel();
    if (state.roomCode) {
      roomSystem.updatedAt = Date.now();
      saveState();
    }
    setDiagStatus(
      "connected",
      "🌐 Synchro mise à jour",
      `Cible active : ${getFirebaseBase() || getRelayBaseUrl()}`
    );
  });
}

if (copyFirebaseRulesBtn) {
  copyFirebaseRulesBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(RECOMMENDED_FIREBASE_RULES);
      setDiagStatus("connected", "📋 Règles copiées", RECOMMENDED_FIREBASE_RULES);
    } catch (_) {
      setDiagStatus("", "🛡️ Règles RTDB", RECOMMENDED_FIREBASE_RULES);
    }
  });
}

if (clearFirebaseBtn) {
  clearFirebaseBtn.addEventListener("click", () => {
    roomSystem.firebaseBaseUrl = "";
    if (firebaseUrlInput) firebaseUrlInput.value = "";
    saveState({ skipBroadcast: true });
    startRoomListeners();
    renderRoomPanel();
    setDiagStatus("connected", "🌐 Relais par défaut", `Relais actif : ${DEFAULT_RELAY_BASE}`);
  });
}

if (buzzBtn) {
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
}

if (clearBuzzBtn) {
  clearBuzzBtn.addEventListener("click", () => {
    state.buzzes = [];
    roomSystem.updatedAt = Date.now();
    saveState();
    renderBuzzUI();
  });
}

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
  if (!playersGrid) return;
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
    if (coverWrap) coverWrap.classList.remove("mystery");
    if (mysteryOverlay) mysteryOverlay.style.display = "none";
    if (stageTitle) stageTitle.textContent = `${track.titre_fr} (${track.titre_en})`;
    if (stageSub) stageSub.textContent = `Disney : ${track.film} (${track.annee}) • ${track.type}`;
    if (revealBtn) revealBtn.textContent = "🙈 Masquer réponse";
  } else {
    if (coverWrap) coverWrap.classList.add("mystery");
    if (mysteryOverlay) mysteryOverlay.style.display = "flex";
    if (stageTitle) stageTitle.textContent = "Manche en cours — Quel est ce morceau ?";
    if (stageSub) stageSub.textContent = "1 pt pour le titre • 1 pt pour le Disney";
    if (revealBtn) revealBtn.textContent = "👁️ Révéler réponse";
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
    state.roundGuesses = [];
    if (!state.playedIds.includes(track.id)) {
      state.playedIds.push(track.id);
    }
    if (guessFeedback) {
      guessFeedback.className = "guess-feedback";
      guessFeedback.textContent = "";
    }
    roomSystem.updatedAt = Date.now();
    saveState();
  }

  renderList();
  renderBuzzUI();
  renderRoundGuesses();

  if (roundBadge) roundBadge.textContent = `Manche #${state.roundNumber} • Piste #${track.id}`;
  if (coverImg) coverImg.src = makeFallbackArtwork(track);
  updateStageRevealUI(track);

  if (audioEl) {
    audioEl.pause();
    audioEl.removeAttribute("src");
    audioEl.load();
  }

  if (seekBar) {
    seekBar.value = 0;
    seekBar.disabled = true;
  }
  if (playPauseBtn) {
    playPauseBtn.disabled = true;
    playPauseBtn.textContent = "▶";
  }
  if (currentTimeLabel) currentTimeLabel.textContent = "0:00";
  if (durationLabel) durationLabel.textContent = "0:30";
  if (fallbackBox) fallbackBox.style.display = "none";
  if (ytFallbackLink) ytFallbackLink.href = track.yt_fallback || "#";
  if (sourceTag) sourceTag.textContent = "Recherche...";
  if (audioStatus) audioStatus.textContent = "Recherche de l'extrait audio et de la pochette...";

  const media = await fetchTrackMedia(track);
  if (mySeq !== loadSeq) return;

  if (coverImg) coverImg.src = media.artworkUrl;
  if (sourceTag) sourceTag.textContent = media.source;

  const thumbEl = document.getElementById(`thumb-${track.id}`);
  if (thumbEl) thumbEl.src = media.artworkUrl;

  if (!media.audioUrl) {
    if (audioStatus) audioStatus.textContent = "Aucun extrait audio trouvé pour ce morceau.";
    if (fallbackBox) fallbackBox.style.display = "block";
    return;
  }

  if (!audioEl) return;
  audioEl.src = media.audioUrl;
  audioEl.volume = volumeBar ? Number(volumeBar.value) : 0.9;
  if (playPauseBtn) playPauseBtn.disabled = false;
  if (seekBar) seekBar.disabled = false;

  try {
    await audioEl.play();
    if (mySeq !== loadSeq) return;
    if (playPauseBtn) playPauseBtn.textContent = "⏸";
    if (audioStatus) audioStatus.textContent = "Lecture en cours...";
  } catch (_) {
    if (mySeq !== loadSeq) return;
    if (playPauseBtn) playPauseBtn.textContent = "▶";
    if (audioStatus) audioStatus.textContent = "Prêt — Appuie sur ▶ pour lancer le son.";
  }
}

window.playTrackById = function (id) {
  const track = DISNEY_TRACKS.find((t) => t.id === id);
  if (track) loadAndPlayTrack(track);
};

if (playPauseBtn && audioEl) {
  playPauseBtn.addEventListener("click", async () => {
    if (!audioEl.src) return;
    if (audioEl.paused) {
      try {
        await audioEl.play();
        playPauseBtn.textContent = "⏸";
        if (audioStatus) audioStatus.textContent = "Lecture en cours...";
      } catch (_) {
        if (audioStatus) audioStatus.textContent = "Impossible de lire ce flux audio.";
        if (fallbackBox) fallbackBox.style.display = "block";
      }
    } else {
      audioEl.pause();
      playPauseBtn.textContent = "▶";
      if (audioStatus) audioStatus.textContent = "En pause";
    }
  });
}

if (audioEl) {
  audioEl.addEventListener("error", () => {
    if (playPauseBtn) playPauseBtn.textContent = "▶";
    if (audioStatus) audioStatus.textContent = "Erreur de chargement du flux audio.";
    if (fallbackBox) fallbackBox.style.display = "block";
  });

  audioEl.addEventListener("loadedmetadata", () => {
    if (durationLabel) durationLabel.textContent = formatTime(audioEl.duration);
  });

  audioEl.addEventListener("timeupdate", () => {
    if (audioEl.duration) {
      if (seekBar) seekBar.value = (audioEl.currentTime / audioEl.duration) * 100;
      if (currentTimeLabel) currentTimeLabel.textContent = formatTime(audioEl.currentTime);
      if (durationLabel) durationLabel.textContent = formatTime(audioEl.duration);
    }
  });

  audioEl.addEventListener("ended", () => {
    if (playPauseBtn) playPauseBtn.textContent = "▶";
    if (audioStatus) audioStatus.textContent = "Extrait terminé — Révèle la réponse ou relance !";
  });

  audioEl.volume = 0.9;
}

if (seekBar && audioEl) {
  seekBar.addEventListener("input", () => {
    if (audioEl.duration) {
      audioEl.currentTime = (seekBar.value / 100) * audioEl.duration;
    }
  });
}

if (volumeBar && audioEl) {
  volumeBar.addEventListener("input", () => {
    audioEl.volume = Number(volumeBar.value);
  });
}

function getFilteredTracks() {
  const q = (searchInput && searchInput.value ? searchInput.value : "").trim().toLowerCase();
  const t = typeFilter ? typeFilter.value : "ALL";
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

if (randomRoundBtn) {
  randomRoundBtn.addEventListener("click", () => {
    const filtered = getFilteredTracks();
    const unplayed = filtered.filter((t) => !state.playedIds.includes(t.id));
    const pool = unplayed.length ? unplayed : filtered;
    if (!pool.length) return;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    loadAndPlayTrack(chosen);
  });
}

if (revealBtn) {
  revealBtn.addEventListener("click", () => {
    const track = DISNEY_TRACKS.find((t) => t.id === state.currentTrackId);
    if (!track) return;
    state.revealed = !state.revealed;
    roomSystem.updatedAt = Date.now();
    saveState();
    updateStageRevealUI(track);
  });
}

const artworkObserver =
  "IntersectionObserver" in window
    ? new IntersectionObserver(
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
      )
    : null;

function renderList() {
  if (!tracksList) return;
  const list = getFilteredTracks();
  if (countLabel) countLabel.textContent = `${list.length} morceau(x) affiché(s) sur ${DISNEY_TRACKS.length}`;
  if (playedLabel) playedLabel.textContent = `${state.playedIds.length} / ${DISNEY_TRACKS.length} joué(s)`;

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

  if (artworkObserver) {
    document.querySelectorAll(".thumb").forEach((img) => {
      const id = Number(img.dataset.trackId);
      if (!metaCache[id]) {
        artworkObserver.observe(img);
      }
    });
  }
}

if (addPlayerBtn && playerNameInput) {
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
}

if (resetScoresBtn) {
  resetScoresBtn.addEventListener("click", () => {
    state.players.forEach((p) => (p.score = 0));
    roomSystem.updatedAt = Date.now();
    saveState();
    renderPlayers();
  });
}

if (resetPlayedBtn) {
  resetPlayedBtn.addEventListener("click", () => {
    state.playedIds = [];
    state.roundNumber = 0;
    roomSystem.updatedAt = Date.now();
    saveState();
    renderList();
  });
}

if (searchInput) searchInput.addEventListener("input", renderList);
if (typeFilter) typeFilter.addEventListener("change", renderList);

// Answer guessing & round feed
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
  const rawFilm = String(track.film || "");
  const parenIdx = rawFilm.indexOf("(");
  const filmNoParen = normalizeAnswer(parenIdx >= 0 ? rawFilm.slice(0, parenIdx) : rawFilm);
  return (
    clean === film ||
    clean === filmNoParen ||
    (clean.length >= 3 && (film.includes(clean) || filmNoParen.includes(clean)))
  );
}

function renderRoundGuesses() {
  if (!roundAnswersList) return;
  if (!Array.isArray(state.roundGuesses) || !state.roundGuesses.length) {
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

if (tabGuessAnswer && tabRoundFeed && guessFormView && roundFeedView) {
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

// Initial boot
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

if (coverImg) {
  coverImg.src = makeFallbackArtwork({ film: "Royaumes des Mélodies", annee: 2026 });
}

setMode(state.mode === "remote" ? "remote" : "local");
renderPlayers();
renderList();
renderBuzzUI();
renderRoomPanel();
renderRoundGuesses();

if (state.mode === "remote" && state.roomCode) {
  (async () => {
    const netSnap = await pullRoomSnapshotFromRelay(state.roomCode);
    const fbSnap = await pullSnapshotFromFirebase(state.roomCode);
    const candidate =
      netSnap && fbSnap
        ? ((netSnap.updatedAt || 0) >= (fbSnap.updatedAt || 0) ? netSnap : fbSnap)
        : (netSnap || fbSnap);

    if (candidate && (candidate.updatedAt || 0) > (roomSystem.updatedAt || 0)) {
      applyRemotePayload(candidate);
    }
    upsertSelfInRoom({ asHost: !roomSystem.hostId, ready: false });
    roomSystem.updatedAt = Date.now();
    saveState();
    renderPlayers();
    renderBuzzUI();
    renderRoomPanel();
  })();
}
