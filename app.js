const THEME_KEY = "disneyBlindTestTheme";
const CUSTOM_TRACKS_KEY = "disneyBlindTestCustomTracks";
const PEER_PREFIX = "disney-bt-room-";

let allTracks = [];
let activeRound = 0;
let totalRounds = 10;
let combo = 0;
let roundPoints = 100;
let timeLeft = 30;
let timerInterval = null;
let currentTrack = null;
let roundSolved = false;

let peer = null;
let role = "host";
let hostConnections = new Map();
let guestConnection = null;
let myPeerId = "";
let roomCode = "";

let roomState = {
  code: "",
  phase: "lobby",
  roundIndex: 0,
  totalRounds: 10,
  mode: "input",
  timeLeft: 30,
  roundPoints: 100,
  buzzerHolder: null,
  lastGuessAttempt: null,
  revealedTrack: null,
  qcmOptions: [],
  players: {}
};

function setTheme(themeName) {
  const chosen = themeName === "savane" ? "savane" : "sombre";
  document.documentElement.setAttribute("data-theme", chosen);
  localStorage.setItem(THEME_KEY, chosen);
}

function generateRoomCode() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `DISNEY-${num}`;
}

function getPseudo() {
  return (document.getElementById("playerPseudo")?.value || "Joueur").trim() || "Joueur";
}

function setConnectionStatus(status, text) {
  const dot = document.getElementById("connDot");
  const label = document.getElementById("connText");
  if (dot) {
    dot.className = "dot " + (status === "online" ? "online" : status === "connecting" ? "connecting" : "");
  }
  if (label) label.textContent = text;
}

function normalizeText(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(le|la|les|l|un|une|des|du|de|the|a|an)\b/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}

function isAnswerMatch(guess, track) {
  const cleanGuess = normalizeText(guess);
  if (!cleanGuess) return false;
  const targets = [track.title, track.movie, ...(track.acceptedAnswers || [])].map(normalizeText);
  return targets.some((target) => {
    if (!target) return false;
    if (cleanGuess === target || target.includes(cleanGuess) || cleanGuess.includes(target)) return true;
    const maxDist = target.length <= 6 ? 1 : 2;
    return levenshtein(cleanGuess, target) <= maxDist;
  });
}

function parseTimecodeToSec(val) {
  if (!val) return 0;
  const str = String(val).trim();
  if (/^\d+:\d{1,2}$/.test(str)) {
    const [m, s] = str.split(":").map(Number);
    return m * 60 + s;
  }
  return Math.max(0, Number(str) || 0);
}

function extractYoutubeId(input) {
  if (!input) return "";
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : "";
}

function normalizeAudioUrl(url) {
  if (!url) return "";
  const trimmed = url.trim();
  if (trimmed.includes("dropbox.com")) {
    return trimmed.replace("www.dropbox.com", "dl.dropboxusercontent.com").replace(/([?&])dl=0/, "$1raw=1");
  }
  return trimmed;
}

async function loadTracks() {
  let baseTracks = [];
  try {
    const res = await fetch("tracks.json");
    if (res.ok) baseTracks = await res.json();
  } catch (_) {}

  let customTracks = [];
  try {
    customTracks = JSON.parse(localStorage.getItem(CUSTOM_TRACKS_KEY) || "[]");
  } catch (_) {}

  const map = new Map();
  baseTracks.forEach((t) => map.set(t.id, { ...t, enabled: t.enabled !== false }));
  customTracks.forEach((t) => map.set(t.id, { ...t, custom: true, enabled: t.enabled !== false }));
  allTracks = Array.from(map.values());
  renderPlaylistEditor();
}

function saveCustomTracks() {
  const customs = allTracks.filter((t) => t.custom);
  localStorage.setItem(CUSTOM_TRACKS_KEY, JSON.stringify(customs));
}

function renderPlaylistEditor() {
  const container = document.getElementById("playlistEditor");
  const filter = (document.getElementById("playlistSearch")?.value || "").toLowerCase();
  if (!container) return;

  const filtered = allTracks.filter(
    (t) => t.title.toLowerCase().includes(filter) || t.movie.toLowerCase().includes(filter)
  );

  container.innerHTML = filtered
    .map(
      (t) => `
      <div class="track-item">
        <label>
          <input type="checkbox" ${t.enabled ? "checked" : ""} onchange="toggleTrack('${t.id}', this.checked)" />
          <div>
            <strong>${t.title}</strong> <span class="muted">— ${t.movie} (${t.year || "?"})</span>
          </div>
        </label>
        <span class="badge">${t.source || "itunes"}</span>
      </div>
    `
    )
    .join("");
}

function toggleTrack(id, checked) {
  const track = allTracks.find((t) => t.id === id);
  if (!track) return;
  track.enabled = checked;
  if (track.custom) saveCustomTracks();
}

function setAllTracks(enabled) {
  allTracks.forEach((t) => {
    t.enabled = enabled;
  });
  saveCustomTracks();
  renderPlaylistEditor();
}

function addCustomTrack(event) {
  event.preventDefault();
  const title = document.getElementById("newTrackTitle").value.trim();
  const movie = document.getElementById("newTrackMovie").value.trim();
  const source = document.getElementById("newTrackSource").value;
  const mediaInput = document.getElementById("newTrackMedia").value.trim();
  const startSec = parseTimecodeToSec(document.getElementById("newTrackStart").value);
  const acceptedRaw = document.getElementById("newTrackAccepted").value.trim();

  if (!title || !movie) return;

  const newTrack = {
    id: "custom-" + Date.now(),
    title,
    movie,
    year: 2024,
    era: "moderne",
    source,
    itunesQuery: source === "itunes" ? (mediaInput || `${title} ${movie}`) : `${title} ${movie}`,
    youtubeId: source === "youtube" ? extractYoutubeId(mediaInput) : "",
    audioUrl: source === "audio" ? normalizeAudioUrl(mediaInput) : "",
    startSec,
    custom: true,
    enabled: true,
    acceptedAnswers: acceptedRaw
      ? acceptedRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : [title, movie]
  };

  allTracks.unshift(newTrack);
  saveCustomTracks();
  renderPlaylistEditor();
  event.target.reset();
}

function exportPlaylistJson() {
  const blob = new Blob([JSON.stringify(allTracks, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "disney-blindtest-playlist.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importPlaylistJson(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(String(reader.result));
      if (Array.isArray(imported)) {
        allTracks = imported.map((t, idx) => ({
          ...t,
          id: t.id || `imp-${Date.now()}-${idx}`,
          custom: true,
          enabled: t.enabled !== false
        }));
        saveCustomTracks();
        renderPlaylistEditor();
      }
    } catch (_) {
      alert("Fichier JSON invalide.");
    }
  };
  reader.readAsText(file);
}

function destroyPeer() {
  if (peer) {
    try { peer.destroy(); } catch (_) {}
    peer = null;
  }
  hostConnections.clear();
  guestConnection = null;
}

function broadcastState() {
  if (role !== "host") return;
  const payload = { type: "SYNC_STATE", state: roomState };
  hostConnections.forEach((conn) => {
    if (conn.open) conn.send(payload);
  });
  syncUiFromRoomState();
}

function createHostRoom(requestedCode) {
  destroyPeer();
  role = "host";
  roomCode = (requestedCode || document.getElementById("roomCodeInput").value || generateRoomCode())
    .trim()
    .toUpperCase();
  document.getElementById("roomCodeInput").value = roomCode;
  setConnectionStatus("connecting", `Création du salon ${roomCode}...`);

  if (typeof Peer === "undefined") {
    myPeerId = "local-host";
    roomState.code = roomCode;
    roomState.players[myPeerId] = { id: myPeerId, name: getPseudo(), score: 0, isHost: true };
    setConnectionStatus("online", `Salon local ${roomCode} prêt`);
    updateInviteDisplay();
    syncUiFromRoomState();
    return;
  }

  peer = new Peer(PEER_PREFIX + roomCode);

  peer.on("open", (id) => {
    myPeerId = id;
    roomState = {
      code: roomCode,
      phase: "lobby",
      roundIndex: 0,
      totalRounds: Number(document.getElementById("roundCount").value) || 10,
      mode: document.getElementById("gameMode").value,
      timeLeft: 30,
      roundPoints: 100,
      buzzerHolder: null,
      lastGuessAttempt: null,
      revealedTrack: null,
      qcmOptions: [],
      players: {
        [myPeerId]: { id: myPeerId, name: getPseudo(), score: 0, isHost: true }
      }
    };
    setConnectionStatus("online", `Hôte connecté • Salon ${roomCode}`);
    updateInviteDisplay();
    syncUiFromRoomState();
  });

  peer.on("connection", (conn) => {
    hostConnections.set(conn.peer, conn);

    conn.on("data", (msg) => {
      handleHostMessage(conn.peer, msg);
    });

    conn.on("close", () => {
      hostConnections.delete(conn.peer);
      delete roomState.players[conn.peer];
      broadcastState();
    });
  });

  peer.on("error", (err) => {
    if (err.type === "unavailable-id") {
      setConnectionStatus("connecting", `Le code ${roomCode} est déjà pris, génération d'un nouveau code...`);
      createHostRoom(generateRoomCode());
    } else {
      setConnectionStatus("", `Erreur réseau PeerJS (${err.type}) — mode local actif`);
    }
  });
}

function joinGuestRoom() {
  const code = (document.getElementById("roomCodeInput").value || "").trim().toUpperCase();
  if (!code) {
    alert("Entre le code du salon (ex. : DISNEY-1042) !");
    return;
  }
  if (typeof Peer === "undefined") {
    alert("La bibliothèque PeerJS n'a pas pu se charger.");
    return;
  }

  destroyPeer();
  role = "guest";
  roomCode = code;
  setConnectionStatus("connecting", `Connexion au salon ${roomCode}...`);

  peer = new Peer();

  peer.on("open", (id) => {
    myPeerId = id;
    const conn = peer.connect(PEER_PREFIX + roomCode, { reliable: true });
    guestConnection = conn;

    conn.on("open", () => {
      setConnectionStatus("online", `Connecté au salon ${roomCode}`);
      conn.send({ type: "HELLO", name: getPseudo() });
      updateInviteDisplay();
      syncUiFromRoomState();
    });

    conn.on("data", (msg) => {
      if (msg?.type === "SYNC_STATE" && msg.state) {
        roomState = msg.state;
        syncUiFromRoomState();
      }
    });

    conn.on("close", () => {
      setConnectionStatus("", "Déconnecté du salon de l'hôte.");
    });
  });

  peer.on("error", (err) => {
    setConnectionStatus("", `Impossible de rejoindre ${roomCode} (${err.type}). Vérifie que l'hôte a ouvert le salon.`);
  });
}

function sendGuestAction(payload) {
  if (role === "guest" && guestConnection && guestConnection.open) {
    guestConnection.send(payload);
  }
}

function handleHostMessage(senderPeerId, msg) {
  if (!msg || typeof msg !== "object") return;

  if (msg.type === "HELLO") {
    const cleanName = String(msg.name || "Ami").trim().slice(0, 24) || "Ami";
    roomState.players[senderPeerId] = {
      id: senderPeerId,
      name: cleanName,
      score: roomState.players[senderPeerId]?.score || 0,
      isHost: false
    };
    broadcastState();
    return;
  }

  if (msg.type === "BUZZ") {
    if (roomState.phase === "playing" && !roomState.buzzerHolder) {
      const player = roomState.players[senderPeerId];
      if (player) {
        roomState.buzzerHolder = { peerId: senderPeerId, name: player.name };
        broadcastState();
      }
    }
    return;
  }

  if (msg.type === "GUESS") {
    if (roomState.phase === "playing" && !roundSolved && currentTrack) {
      const player = roomState.players[senderPeerId];
      if (!player) return;
      if (isAnswerMatch(msg.text, currentTrack)) {
        awardPointsToPlayer(senderPeerId, roomState.roundPoints);
      } else {
        roomState.lastGuessAttempt = { name: player.name, text: String(msg.text || "").slice(0, 60), correct: false };
        broadcastState();
      }
    }
    return;
  }

  if (msg.type === "CHOICE") {
    if (roomState.phase === "playing" && !roundSolved && currentTrack) {
      if (msg.trackId === currentTrack.id) {
        awardPointsToPlayer(senderPeerId, roomState.roundPoints);
      }
    }
  }
}

function updatePseudoInRoom() {
  const newName = getPseudo();
  if (role === "host" && roomState.players[myPeerId]) {
    roomState.players[myPeerId].name = newName;
    broadcastState();
  } else if (role === "guest") {
    sendGuestAction({ type: "HELLO", name: newName });
  }
}

function updateInviteDisplay() {
  const inviteLink = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(roomCode)}`;
  const el = document.getElementById("inviteStatus");
  if (el) {
    el.innerHTML = `Lien d'invitation direct : <strong>${inviteLink}</strong>`;
  }
}

function copyInviteLink() {
  const inviteLink = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(roomCode)}`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(inviteLink).then(() => {
      alert("Lien d'invitation copié ! Envoie-le à tes amis sur Discord ou par message.");
    });
  } else {
    prompt("Copie ce lien d'invitation :", inviteLink);
  }
}

function triggerBuzzer() {
  if (role === "guest") {
    sendGuestAction({ type: "BUZZ" });
    return;
  }
  if (roomState.phase === "playing" && !roomState.buzzerHolder && roomState.players[myPeerId]) {
    roomState.buzzerHolder = { peerId: myPeerId, name: roomState.players[myPeerId].name };
    broadcastState();
  }
}

function resetBuzzer() {
  if (role !== "host") return;
  roomState.buzzerHolder = null;
  broadcastState();
}

function validateBuzzerSuccess() {
  if (role !== "host" || !roomState.buzzerHolder) return;
  awardPointsToPlayer(roomState.buzzerHolder.peerId, roomState.roundPoints);
}

function rejectBuzzerAttempt() {
  if (role !== "host" || !roomState.buzzerHolder) return;
  roomState.lastGuessAttempt = {
    name: roomState.buzzerHolder.name,
    text: "Mauvaise réponse à l'oral",
    correct: false
  };
  roomState.buzzerHolder = null;
  broadcastState();
}

function awardPointsToPlayer(targetPeerId, pts) {
  const player = roomState.players[targetPeerId];
  if (!player) return;
  const bonus = targetPeerId === myPeerId ? combo * 10 : 0;
  const gained = pts + bonus;
  player.score += gained;
  if (targetPeerId === myPeerId) combo += 1;
  else combo = 0;

  revealRound(true, `🎉 ${player.name} trouve la réponse (+${gained} pts) !`);
}

function renderAllLeaderboards() {
  const list = Object.values(roomState.players || {}).sort((a, b) => b.score - a.score);
  const html = list.length
    ? list
        .map(
          (p, idx) => `
          <div class="leaderboard-item">
            <span>#${idx + 1} <strong>${p.name}</strong> ${p.isHost ? '<span class="badge">Hôte</span>' : ""}</span>
            <strong>${p.score} pts</strong>
          </div>`
        )
        .join("")
    : `<p class="muted">En attente de joueurs dans le salon ${roomState.code}...</p>`;

  ["lobbyLeaderboard", "gameLeaderboard", "endLeaderboard"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  });
}

function syncUiFromRoomState() {
  renderAllLeaderboards();

  const isGuest = role === "guest";
  const hostSetupBox = document.getElementById("hostOnlySetup");
  const guestWaitBox = document.getElementById("guestLobbyBanner");
  if (hostSetupBox) hostSetupBox.classList.toggle("hidden", isGuest);
  if (guestWaitBox) guestWaitBox.classList.toggle("hidden", !isGuest);

  const setupSec = document.getElementById("setupSection");
  const gameSec = document.getElementById("gameSection");
  const endSec = document.getElementById("endSection");

  if (roomState.phase === "lobby") {
    setupSec.classList.remove("hidden");
    gameSec.classList.add("hidden");
    endSec.classList.add("hidden");
    return;
  }

  if (roomState.phase === "ended") {
    setupSec.classList.add("hidden");
    gameSec.classList.add("hidden");
    endSec.classList.remove("hidden");
    const winner = Object.values(roomState.players || {}).sort((a, b) => b.score - a.score)[0];
    document.getElementById("finalScoreText").textContent = winner
      ? `Vainqueur : ${winner.name} avec ${winner.score} points !`
      : "Partie terminée !";
    document.getElementById("hostEndControls").classList.toggle("hidden", isGuest);
    return;
  }

  setupSec.classList.add("hidden");
  endSec.classList.add("hidden");
  gameSec.classList.remove("hidden");

  document.getElementById("roundIndicator").textContent = `Manche ${roomState.roundIndex + 1} / ${roomState.totalRounds}`;
  const myScore = roomState.players[myPeerId]?.score || 0;
  document.getElementById("scoreIndicator").textContent = `Ton score : ${myScore} pts`;
  document.getElementById("timerBar").style.width = `${Math.max(0, (roomState.timeLeft / 30) * 100)}%`;

  document.getElementById("hostMediaWrap").classList.toggle("hidden", isGuest);
  document.getElementById("hostRoundControls").classList.toggle("hidden", isGuest);

  const buzzerBox = document.getElementById("buzzerBanner");
  const buzzerText = document.getElementById("buzzerBannerText");
  const hostArb = document.getElementById("hostBuzzerArbitration");
  const megaBtn = document.getElementById("megaBuzzerBtn");

  if (roomState.buzzerHolder) {
    buzzerBox.classList.remove("hidden");
    buzzerText.textContent = `🚨 ${roomState.buzzerHolder.name} a buzzé en premier !`;
    hostArb.classList.toggle("hidden", isGuest);
    megaBtn.disabled = true;
  } else {
    buzzerBox.classList.add("hidden");
    hostArb.classList.add("hidden");
    megaBtn.disabled = roomState.phase !== "playing";
  }

  const attemptNote = document.getElementById("lastAttemptNote");
  if (roomState.lastGuessAttempt && !roomState.lastGuessAttempt.correct && roomState.phase === "playing") {
    attemptNote.classList.remove("hidden");
    attemptNote.textContent = `❌ ${roomState.lastGuessAttempt.name} a tenté : "${roomState.lastGuessAttempt.text}"`;
  } else {
    attemptNote.classList.add("hidden");
  }

  const guessForm = document.getElementById("guessForm");
  const qcmBox = document.getElementById("qcmChoices");
  const guessInput = document.getElementById("guessInput");

  if (roomState.mode === "qcm") {
    guessForm.classList.add("hidden");
    qcmBox.classList.remove("hidden");
    qcmBox.innerHTML = (roomState.qcmOptions || [])
      .map(
        (opt) =>
          `<button type="button" class="secondary" ${roomState.phase !== "playing" ? "disabled" : ""} onclick="submitChoice('${opt.id}')">${opt.label}</button>`
      )
      .join("");
  } else {
    guessForm.classList.remove("hidden");
    qcmBox.classList.add("hidden");
    guessInput.disabled = roomState.phase !== "playing";
  }

  const fb = document.getElementById("roundFeedback");
  if (roomState.phase === "revealed" && roomState.revealedTrack) {
    fb.classList.remove("hidden");
    fb.innerHTML = `
      <strong>${roomState.revealedTrack.message}</strong><br/>
      Chanson : <strong>${roomState.revealedTrack.title}</strong> — <em>${roomState.revealedTrack.movie}</em> (${roomState.revealedTrack.year || "?"})
    `;
  } else {
    fb.classList.add("hidden");
  }
}

function stopAllMedia() {
  const audioEl = document.getElementById("audioPlayer");
  if (audioEl) {
    audioEl.pause();
    audioEl.removeAttribute("src");
  }
  const ytBox = document.getElementById("ytHiddenContainer");
  if (ytBox) ytBox.innerHTML = "";
}

async function playTrackMedia(track) {
  if (role !== "host") return;
  stopAllMedia();
  const startSec = track.startSec || 0;

  if (track.source === "youtube" && extractYoutubeId(track.youtubeId)) {
    const vid = extractYoutubeId(track.youtubeId);
    const ytBox = document.getElementById("ytHiddenContainer");
    ytBox.innerHTML = `<iframe id="ytFrame" width="1" height="1" src="https://www.youtube.com/embed/${vid}?start=${startSec}&autoplay=1&enablejsapi=1" allow="autoplay"></iframe>`;
    return;
  }

  if (track.source === "audio" && track.audioUrl) {
    const audioEl = document.getElementById("audioPlayer");
    audioEl.src = normalizeAudioUrl(track.audioUrl);
    audioEl.currentTime = startSec;
    await audioEl.play().catch(() => {});
    return;
  }

  const query = encodeURIComponent(track.itunesQuery || `${track.title} ${track.movie}`);
  try {
    const res = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=5&country=FR`);
    const data = await res.json();
    const preview = data.results?.[0]?.previewUrl;
    if (preview) {
      const audioEl = document.getElementById("audioPlayer");
      audioEl.src = preview;
      audioEl.currentTime = Math.min(startSec, 25);
      await audioEl.play().catch(() => {});
    }
  } catch (_) {}
}

function startGame() {
  if (role !== "host") return;
  const eligible = allTracks.filter((t) => t.enabled);
  if (!eligible.length) {
    alert("Active au moins une chanson dans la playlist !");
    return;
  }

  const requestedRounds = Number(document.getElementById("roundCount").value) || 10;
  const pool = [...eligible].sort(() => Math.random() - 0.5).slice(0, Math.min(requestedRounds, eligible.length));
  window.__gamePool = pool;
  totalRounds = pool.length;
  activeRound = 0;
  combo = 0;

  Object.values(roomState.players).forEach((p) => {
    p.score = 0;
  });

  nextRound();
}

function nextRound() {
  if (role !== "host") return;
  clearInterval(timerInterval);
  stopAllMedia();
  roundSolved = false;

  if (activeRound >= totalRounds) {
    finishGame();
    return;
  }

  currentTrack = window.__gamePool[activeRound];
  timeLeft = 30;
  roundPoints = 100;

  const mode = document.getElementById("gameMode").value;
  let qcmOptions = [];
  if (mode === "qcm") {
    const distractors = allTracks
      .filter((t) => t.id !== currentTrack.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    qcmOptions = [currentTrack, ...distractors]
      .sort(() => Math.random() - 0.5)
      .map((opt) => ({ id: opt.id, label: `${opt.title} — ${opt.movie}` }));
  }

  document.getElementById("guessInput").value = "";

  roomState.phase = "playing";
  roomState.roundIndex = activeRound;
  roomState.totalRounds = totalRounds;
  roomState.mode = mode;
  roomState.timeLeft = 30;
  roomState.roundPoints = 100;
  roomState.buzzerHolder = null;
  roomState.lastGuessAttempt = null;
  roomState.revealedTrack = null;
  roomState.qcmOptions = qcmOptions;

  broadcastState();
  playTrackMedia(currentTrack);

  timerInterval = setInterval(() => {
    timeLeft -= 0.5;
    roundPoints = Math.max(25, Math.round((timeLeft / 30) * 100));
    roomState.timeLeft = Math.max(0, timeLeft);
    roomState.roundPoints = roundPoints;
    broadcastState();

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      revealRound(false, "⏰ Temps écoulé !");
    }
  }, 500);
}

function submitGuess(event) {
  event.preventDefault();
  const inputEl = document.getElementById("guessInput");
  const val = inputEl.value.trim();
  if (!val) return;

  if (role === "guest") {
    sendGuestAction({ type: "GUESS", text: val });
    inputEl.value = "";
    return;
  }

  if (roundSolved || roomState.phase !== "playing") return;
  if (isAnswerMatch(val, currentTrack)) {
    awardPointsToPlayer(myPeerId, roundPoints);
  } else {
    roomState.lastGuessAttempt = { name: getPseudo(), text: val, correct: false };
    inputEl.value = "";
    inputEl.placeholder = "Pas tout à fait, essaie encore...";
    broadcastState();
  }
}

function submitChoice(trackId) {
  if (role === "guest") {
    sendGuestAction({ type: "CHOICE", trackId });
    return;
  }
  if (roundSolved || roomState.phase !== "playing") return;
  if (trackId === currentTrack.id) {
    awardPointsToPlayer(myPeerId, roundPoints);
  } else {
    combo = 0;
    revealRound(false, "❌ Mauvais choix !");
  }
}

function revealRound(success, message) {
  if (role !== "host" || roundSolved) return;
  roundSolved = true;
  clearInterval(timerInterval);
  if (!success) combo = 0;

  roomState.phase = "revealed";
  roomState.revealedTrack = {
    title: currentTrack.title,
    movie: currentTrack.movie,
    year: currentTrack.year,
    message
  };
  broadcastState();
}

function goToNextRound() {
  if (role !== "host") return;
  activeRound += 1;
  nextRound();
}

function finishGame() {
  if (role !== "host") return;
  stopAllMedia();
  roomState.phase = "ended";
  broadcastState();
}

function backToSetup() {
  if (role !== "host") return;
  stopAllMedia();
  clearInterval(timerInterval);
  roomState.phase = "lobby";
  roomState.buzzerHolder = null;
  roomState.revealedTrack = null;
  broadcastState();
}

window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem(THEME_KEY) || "sombre";
  setTheme(savedTheme);
  loadTracks();

  const params = new URLSearchParams(window.location.search);
  const urlRoom = params.get("room");
  if (urlRoom) {
    document.getElementById("roomCodeInput").value = urlRoom.toUpperCase();
    joinGuestRoom();
  } else {
    createHostRoom(generateRoomCode());
  }
});
