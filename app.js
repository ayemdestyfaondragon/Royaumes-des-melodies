const STORAGE_KEY = "royaumes_melodies_v6";
const metaCache = {};
let loadSeq = 0;

// Canal temps réel multi-onglets (même navigateur) + état partagé par code de salon
let broadcastChannel = null;
let roomPollTimer = null;

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
  buzzes: [] // { pseudo, at, label }
};

try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  if (saved && Array.isArray(saved.players) && saved.players.length) {
    state = { ...state, ...saved };
  }
} catch (_) {}

// Lecture éventuelle d'un code salon dans l'URL (?room=XXXX)
const urlParams = new URLSearchParams(window.location.search);
const initialRoomParam = (urlParams.get("room") || "").trim().toUpperCase();
if (initialRoomParam) {
  state.mode = "remote";
  state.roomCode = initialRoomParam;
}

function roomStorageKey(code) {
  return `royaumes_room_${String(code || "").toUpperCase()}`;
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {}

  if (state.mode === "remote" && state.roomCode) {
    const payload = {
      roomCode: state.roomCode,
      players: state.players,
      nextPlayerId: state.nextPlayerId,
      roundNumber: state.roundNumber,
      currentTrackId: state.currentTrackId,
      revealed: state.revealed,
      playedIds: state.playedIds,
      buzzes: state.buzzes,
      updatedAt: Date.now()
    };
    try {
      localStorage.setItem(roomStorageKey(state.roomCode), JSON.stringify(payload));
    } catch (_) {}

    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: "ROOM_SYNC", payload });
    }
  }
}

const tabLocal = document.getElementById("tabLocal");
const tabRemote = document.getElementById("tabRemote");
const remoteBox = document.getElementById("remoteBox");
const syncStatus = document.getElementById("syncStatus");
const roomCodeBadge = document.getElementById("roomCodeBadge");
const remotePseudoInput = document.getElementById("remotePseudoInput");
const createRoomBtn = document.getElementById("createRoomBtn");
const joinRoomInput = document.getElementById("joinRoomInput");
const joinRoomBtn = document.getElementById("joinRoomBtn");
const copyInviteBtn = document.getElementById("copyInviteBtn");

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
  return String(str)
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

function ensurePlayerForPseudo(pseudo) {
  const clean = String(pseudo || "").trim();
  if (!clean) return;
  const exists = state.players.some((p) => p.name.toLowerCase() === clean.toLowerCase());
  if (!exists) {
    state.players.push({ id: state.nextPlayerId++, name: clean, score: 0 });
  }
}

function renderBuzzUI() {
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
  const trackChanged = payload.currentTrackId && payload.currentTrackId !== state.currentTrackId;
  const revealChanged = payload.revealed !== state.revealed;

  state.players = Array.isArray(payload.players) && payload.players.length ? payload.players : state.players;
  state.nextPlayerId = payload.nextPlayerId || state.nextPlayerId;
  state.roundNumber = payload.roundNumber ?? state.roundNumber;
  state.currentTrackId = payload.currentTrackId ?? state.currentTrackId;
  state.revealed = Boolean(payload.revealed);
  state.playedIds = Array.isArray(payload.playedIds) ? payload.playedIds : state.playedIds;
  state.buzzes = Array.isArray(payload.buzzes) ? payload.buzzes : [];

  renderPlayers();
  renderList();
  renderBuzzUI();

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
      if (parsed && parsed.updatedAt) {
        applyRemotePayload(parsed);
      }
    } catch (_) {}
  }, 800);
}

function setMode(newMode) {
  state.mode = newMode;
  if (newMode === "remote") {
    if (!state.roomCode) {
      state.roomCode = generateRoomCode();
    }
    tabLocal.classList.remove("active");
    tabRemote.classList.add("active");
    remoteBox.style.display = "flex";
    syncStatus.textContent = `Mode Multi • Salon ${state.roomCode}`;
    roomCodeBadge.textContent = `SALON : ${state.roomCode}`;
    startRoomListeners();
  } else {
    tabRemote.classList.remove("active");
    tabLocal.classList.add("active");
    remoteBox.style.display = "none";
    syncStatus.textContent = "Mode Local actif";
    if (roomPollTimer) clearInterval(roomPollTimer);
  }
  renderBuzzUI();
  saveState();
}

tabLocal.addEventListener("click", () => setMode("local"));
tabRemote.addEventListener("click", () => setMode("remote"));

createRoomBtn.addEventListener("click", () => {
  state.roomCode = generateRoomCode();
  const pseudo = remotePseudoInput.value.trim();
  if (pseudo) {
    state.remotePseudo = pseudo;
    ensurePlayerForPseudo(pseudo);
  }
  roomCodeBadge.textContent = `SALON : ${state.roomCode}`;
  syncStatus.textContent = `Mode Multi • Salon ${state.roomCode}`;
  startRoomListeners();
  saveState();
  renderPlayers();
  renderBuzzUI();
});

joinRoomBtn.addEventListener("click", () => {
  const code = joinRoomInput.value.trim().toUpperCase();
  if (!code) return;
  state.roomCode = code;
  const pseudo = remotePseudoInput.value.trim() || "Joueur distant";
  state.remotePseudo = pseudo;
  ensurePlayerForPseudo(pseudo);
  roomCodeBadge.textContent = `SALON : ${state.roomCode}`;
  syncStatus.textContent = `Mode Multi • Salon ${state.roomCode}`;
  startRoomListeners();

  try {
    const existing = JSON.parse(localStorage.getItem(roomStorageKey(code)) || "null");
    if (existing) {
      applyRemotePayload(existing);
    }
  } catch (_) {}

  saveState();
  renderPlayers();
  renderBuzzUI();
});

copyInviteBtn.addEventListener("click", async () => {
  if (!state.roomCode) return;
  const baseUrl = window.location.href.split("?")[0];
  const inviteUrl = `${baseUrl}?room=${encodeURIComponent(state.roomCode)}`;
  try {
    await navigator.clipboard.writeText(inviteUrl);
    syncStatus.textContent = `Lien copié pour le salon ${state.roomCode} !`;
  } catch (_) {
    syncStatus.textContent = `Code salon : ${state.roomCode}`;
  }
});

buzzBtn.addEventListener("click", () => {
  if (!state.currentTrackId) return;
  const pseudo = remotePseudoInput.value.trim() || state.remotePseudo || "Joueur distant";
  state.remotePseudo = pseudo;
  ensurePlayerForPseudo(pseudo);

  const now = new Date();
  const label = `${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}.${String(Math.floor(now.getMilliseconds() / 10)).padStart(2, "0")}`;

  if (!state.buzzes.some((b) => b.pseudo.toLowerCase() === pseudo.toLowerCase())) {
    state.buzzes.push({ pseudo, at: Date.now(), label });
  }
  saveState();
  renderPlayers();
  renderBuzzUI();
});

clearBuzzBtn.addEventListener("click", () => {
  state.buzzes = [];
  saveState();
  renderBuzzUI();
});

function makeFallbackArtwork(track) {
  const title = encodeURIComponent(track.film.slice(0, 26));
  const year = encodeURIComponent(String(track.annee));
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
  saveState();
  renderPlayers();
};

window.removePlayer = function (playerId) {
  if (state.players.length <= 1) return;
  state.players = state.players.filter((pl) => pl.id !== playerId);
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
  saveState();
  renderPlayers();
});

playerNameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addPlayerBtn.click();
});

resetScoresBtn.addEventListener("click", () => {
  state.players.forEach((p) => (p.score = 0));
  saveState();
  renderPlayers();
});

resetPlayedBtn.addEventListener("click", () => {
  state.playedIds = [];
  state.roundNumber = 0;
  saveState();
  renderList();
});

searchInput.addEventListener("input", renderList);
typeFilter.addEventListener("change", renderList);

if (state.remotePseudo) {
  remotePseudoInput.value = state.remotePseudo;
}
if (state.roomCode) {
  roomCodeBadge.textContent = `SALON : ${state.roomCode}`;
}

coverImg.src = makeFallbackArtwork({ film: "Royaumes des Mélodies", annee: 2026 });
setMode(state.mode === "remote" ? "remote" : "local");
renderPlayers();
renderList();
renderBuzzUI();


// =========================================================
// SYSTÈME DE ROOMS (Hôte, Joueurs, Prêt, Chat, URL & Firebase)
// =========================================================
const ROOM_META_KEY = "royaumes_room_system_v1";

let roomSystem = {
  clientId: "",
  roomName: "Salon Royal Disney",
  hostId: "",
  firebaseBaseUrl: "",
  members: [], // { clientId, pseudo, ready, joinedAt, isHost }
  messages: [], // { id, sender, text, ts, system }
  lastAction: null // { type, payload, ts }
};

try {
  const savedRoomSys = JSON.parse(localStorage.getItem(ROOM_META_KEY) || "null");
  if (savedRoomSys && typeof savedRoomSys === "object") {
    roomSystem = { ...roomSystem, ...savedRoomSys };
  }
} catch (_) {}

if (!roomSystem.clientId) {
  roomSystem.clientId = "cli_" + Math.random().toString(36).slice(2, 10);
}

const roomRolePill = document.getElementById("roomRolePill");
const roomConnectionBadge = document.getElementById("roomConnectionBadge");
const toggleReadyBtn = document.getElementById("toggleReadyBtn");
const leaveRoomBtn = document.getElementById("leaveRoomBtn");
const roomNameInput = document.getElementById("roomNameInput");
const roomTitleDisplay = document.getElementById("roomTitleDisplay");
const roomCountLabel = document.getElementById("roomCountLabel");
const roomRosterList = document.getElementById("roomRosterList");
const roomChatLog = document.getElementById("roomChatLog");
const roomChatForm = document.getElementById("roomChatForm");
const roomChatInput = document.getElementById("roomChatInput");
const firebaseUrlInput = document.getElementById("firebaseUrlInput");
const saveFirebaseBtn = document.getElementById("saveFirebaseBtn");

function normalizeFirebaseBase(raw) {
  const trimmed = String(raw || "").trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  if (!/^https?:\/\//i.test(trimmed)) return "";
  return trimmed;
}

function isCurrentUserHost() {
  if (!state.roomCode) return true;
  if (!roomSystem.hostId) return true;
  return roomSystem.hostId === roomSystem.clientId;
}

function currentPseudo() {
  const typed = (remotePseudoInput && remotePseudoInput.value.trim()) || "";
  if (typed) {
    state.remotePseudo = typed;
  }
  if (!state.remotePseudo) {
    state.remotePseudo = "Joueur_" + roomSystem.clientId.slice(-4);
  }
  return state.remotePseudo;
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
    existing.isHost = roomSystem.hostId === roomSystem.clientId;
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

function renderRoomPanel() {
  if (!roomRolePill) return;
  const hostMode = isCurrentUserHost();
  roomRolePill.textContent = hostMode ? "👑 Hôte de la room" : "👤 Joueur connecté";
  roomRolePill.className = hostMode ? "room-role-pill host" : "room-role-pill";

  const fbActive = Boolean(normalizeFirebaseBase(roomSystem.firebaseBaseUrl));
  roomConnectionBadge.textContent = fbActive
    ? "• Synchro Firebase active"
    : "• Synchro locale / multi-onglets";

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
  const target = roomSystem.members.find((m) => m.clientId === targetClientId);
  appendRoomSystemMessage(`${target ? target.pseudo : "Un joueur"} est maintenant hôte de la room.`);
  syncRoomNow();
};

function syncRoomNow() {
  try {
    localStorage.setItem(ROOM_META_KEY, JSON.stringify(roomSystem));
  } catch (_) {}

  saveState();
  renderRoomPanel();

  if (state.mode === "remote" && state.roomCode) {
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

const origApplyRemotePayload = applyRemotePayload;
applyRemotePayload = function (payload) {
  if (!payload || payload.roomCode !== state.roomCode) return;
  if (payload.roomName) roomSystem.roomName = payload.roomName;
  if (payload.hostId) roomSystem.hostId = payload.hostId;
  if (Array.isArray(payload.members)) roomSystem.members = payload.members;
  if (Array.isArray(payload.messages)) roomSystem.messages = payload.messages;

  origApplyRemotePayload(payload);
  renderRoomPanel();
};

const origCreateClick = createRoomBtn.onclick;
createRoomBtn.addEventListener("click", () => {
  const customName = (roomNameInput && roomNameInput.value.trim()) || "";
  roomSystem.roomName = customName || `Room ${state.roomCode}`;
  roomSystem.hostId = roomSystem.clientId;
  roomSystem.members = [];
  roomSystem.messages = [];
  upsertSelfInRoom({ asHost: true, ready: true });
  appendRoomSystemMessage(`${currentPseudo()} a créé la room "${roomSystem.roomName}".`);
  syncRoomNow();
});

joinRoomBtn.addEventListener("click", async () => {
  const code = joinRoomInput.value.trim().toUpperCase();
  if (!code) return;
  state.roomCode = code;
  roomCodeBadge.textContent = `SALON : ${state.roomCode}`;
  syncStatus.textContent = `Mode Multi • Salon ${state.roomCode}`;
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
  syncRoomNow();
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
    syncRoomNow();
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
      appendRoomSystemMessage(`${roomSystem.members[0].pseudo} devient le nouvel hôte.`);
    }
    syncRoomNow();
    state.roomCode = "";
    roomCodeBadge.textContent = "ROOM : ------";
    syncStatus.textContent = "Mode Multi • Hors room";
    saveState();
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
    syncRoomNow();
  });
}

if (saveFirebaseBtn) {
  saveFirebaseBtn.addEventListener("click", async () => {
    const clean = normalizeFirebaseBase(firebaseUrlInput && firebaseUrlInput.value);
    roomSystem.firebaseBaseUrl = clean;
    try {
      localStorage.setItem(ROOM_META_KEY, JSON.stringify(roomSystem));
    } catch (_) {}
    renderRoomPanel();
    if (clean && state.roomCode) {
      const remoteSnap = await pullSnapshotFromFirebase();
      if (remoteSnap && (remoteSnap.updatedAt || 0) > Date.now() - 86400000) {
        applyRemotePayload(remoteSnap);
      } else {
        syncRoomNow();
      }
    }
  });
}

if (roomNameInput && roomSystem.roomName) {
  roomNameInput.value = roomSystem.roomName;
}
if (firebaseUrlInput && roomSystem.firebaseBaseUrl) {
  firebaseUrlInput.value = roomSystem.firebaseBaseUrl;
}

if (state.roomCode) {
  upsertSelfInRoom({ asHost: !roomSystem.hostId, ready: false });
  if (normalizeFirebaseBase(roomSystem.firebaseBaseUrl)) {
    setInterval(async () => {
      if (state.mode === "remote" && state.roomCode) {
        const snap = await pullSnapshotFromFirebase();
        if (snap && snap.updatedAt) {
          applyRemotePayload(snap);
        }
      }
    }, 1500);
  }
}

renderRoomPanel();
