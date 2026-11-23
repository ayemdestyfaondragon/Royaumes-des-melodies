const THEME_KEY = "disneyBlindTestTheme";
const CUSTOM_TRACKS_KEY = "disneyBlindTestCustomTracks";
const ROOM_STORAGE_PREFIX = "disneyBlindTestRoom_";

let allTracks = [];
let activeRound = 0;
let totalRounds = 10;
let score = 0;
let combo = 0;
let roundPoints = 100;
let timeLeft = 30;
let timerInterval = null;
let currentTrack = null;
let roundSolved = false;
let ytPlayer = null;
let ytReady = false;
let roomChannel = null;
let roomCode = "DISNEY-1042";

function setTheme(themeName) {
  const chosen = themeName === "savane" ? "savane" : "sombre";
  document.documentElement.setAttribute("data-theme", chosen);
  localStorage.setItem(THEME_KEY, chosen);
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

function getRoomState() {
  const raw = localStorage.getItem(ROOM_STORAGE_PREFIX + roomCode);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (_) {}
  }
  return {
    code: roomCode,
    players: {},
    buzzerHolder: null
  };
}

function saveRoomState(state) {
  localStorage.setItem(ROOM_STORAGE_PREFIX + roomCode, JSON.stringify(state));
  if (roomChannel) {
    roomChannel.postMessage({ type: "STATE_UPDATE", state });
  }
  renderLeaderboard(state);
}

function initRoom() {
  const params = new URLSearchParams(window.location.search);
  const urlRoom = params.get("room");
  if (urlRoom) roomCode = urlRoom.toUpperCase();
  document.getElementById("roomCodeInput").value = roomCode;

  if ("BroadcastChannel" in window) {
    roomChannel = new BroadcastChannel("disney_blindtest_room_" + roomCode);
    roomChannel.onmessage = (ev) => {
      if (ev.data?.type === "STATE_UPDATE") {
        renderLeaderboard(ev.data.state);
      }
    };
  }
  renderLeaderboard(getRoomState());
}

function joinOrCreateRoom() {
  const codeInput = (document.getElementById("roomCodeInput").value || "DISNEY-1042").trim().toUpperCase();
  const pseudo = (document.getElementById("playerPseudo").value || "Joueur").trim();
  roomCode = codeInput;
  const state = getRoomState();
  if (!state.players[pseudo]) {
    state.players[pseudo] = { name: pseudo, score: 0 };
  }
  saveRoomState(state);
  const inviteLink = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(roomCode)}`;
  document.getElementById("inviteStatus").textContent = `Salon ${roomCode} actif — Lien : ${inviteLink}`;
}

function triggerBuzzer() {
  const pseudo = (document.getElementById("playerPseudo").value || "Joueur").trim();
  const state = getRoomState();
  if (!state.buzzerHolder) {
    state.buzzerHolder = pseudo;
    saveRoomState(state);
    document.getElementById("buzzerStatus").textContent = `🚨 ${pseudo} a buzzé en premier !`;
  }
}

function resetBuzzer() {
  const state = getRoomState();
  state.buzzerHolder = null;
  saveRoomState(state);
  document.getElementById("buzzerStatus").textContent = "Buzzer réinitialisé.";
}

function updatePlayerScore(delta) {
  const pseudo = (document.getElementById("playerPseudo").value || "Joueur").trim();
  const state = getRoomState();
  if (!state.players[pseudo]) state.players[pseudo] = { name: pseudo, score: 0 };
  state.players[pseudo].score = Math.max(0, state.players[pseudo].score + delta);
  saveRoomState(state);
}

function renderLeaderboard(state) {
  const el = document.getElementById("leaderboard");
  if (!el) return;
  const list = Object.values(state.players || {}).sort((a, b) => b.score - a.score);
  if (!list.length) {
    el.innerHTML = `<p class="muted">Aucun joueur enregistré dans le salon ${state.code}.</p>`;
    return;
  }
  el.innerHTML = list
    .map((p, idx) => `<div class="leaderboard-item"><span>#${idx + 1} ${p.name}</span><strong>${p.score} pts</strong></div>`)
    .join("");
}

window.onYouTubeIframeAPIReady = function () {
  ytReady = true;
};

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
  score = 0;
  combo = 0;

  const state = getRoomState();
  state.buzzerHolder = null;
  saveRoomState(state);

  document.getElementById("setupSection").classList.add("hidden");
  document.getElementById("endSection").classList.add("hidden");
  document.getElementById("gameSection").classList.remove("hidden");
  nextRound();
}

function nextRound() {
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

  document.getElementById("roundIndicator").textContent = `Manche ${activeRound + 1} / ${totalRounds}`;
  document.getElementById("scoreIndicator").textContent = `Score : ${score} pts`;
  document.getElementById("guessInput").value = "";
  document.getElementById("guessInput").disabled = false;
  document.getElementById("roundFeedback").classList.add("hidden");
  document.getElementById("timerBar").style.width = "100%";

  const mode = document.getElementById("gameMode").value;
  const qcmBox = document.getElementById("qcmChoices");
  const guessForm = document.getElementById("guessForm");

  if (mode === "qcm") {
    guessForm.classList.add("hidden");
    qcmBox.classList.remove("hidden");
    const distractors = allTracks
      .filter((t) => t.id !== currentTrack.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const options = [currentTrack, ...distractors].sort(() => Math.random() - 0.5);
    qcmBox.innerHTML = options
      .map(
        (opt) =>
          `<button type="button" class="secondary" onclick="submitChoice('${opt.id}')">${opt.title} — ${opt.movie}</button>`
      )
      .join("");
  } else {
    guessForm.classList.remove("hidden");
    qcmBox.classList.add("hidden");
  }

  const rState = getRoomState();
  rState.buzzerHolder = null;
  saveRoomState(rState);

  playTrackMedia(currentTrack);

  timerInterval = setInterval(() => {
    timeLeft -= 0.25;
    roundPoints = Math.max(25, Math.round((timeLeft / 30) * 100));
    document.getElementById("timerBar").style.width = `${Math.max(0, (timeLeft / 30) * 100)}%`;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      revealRound(false, "Temps écoulé !");
    }
  }, 250);
}

function submitGuess(event) {
  event.preventDefault();
  if (roundSolved) return;
  const val = document.getElementById("guessInput").value;
  if (isAnswerMatch(val, currentTrack)) {
    const gained = roundPoints + combo * 10;
    score += gained;
    combo += 1;
    updatePlayerScore(gained);
    revealRound(true, `Bravo ! +${gained} pts (série x${combo})`);
  } else {
    document.getElementById("guessInput").value = "";
    document.getElementById("guessInput").placeholder = "Pas tout à fait, essaie encore...";
  }
}

function submitChoice(trackId) {
  if (roundSolved) return;
  if (trackId === currentTrack.id) {
    const gained = roundPoints + combo * 10;
    score += gained;
    combo += 1;
    updatePlayerScore(gained);
    revealRound(true, `Bonne réponse ! +${gained} pts`);
  } else {
    combo = 0;
    revealRound(false, "Mauvais choix !");
  }
}

function revealRound(success, message) {
  if (roundSolved) return;
  roundSolved = true;
  clearInterval(timerInterval);
  if (!success) combo = 0;

  document.getElementById("guessInput").disabled = true;
  document.getElementById("scoreIndicator").textContent = `Score : ${score} pts`;
  const fb = document.getElementById("roundFeedback");
  fb.classList.remove("hidden");
  fb.innerHTML = `
    <strong>${message}</strong><br/>
    Chanson : <strong>${currentTrack.title}</strong> — <em>${currentTrack.movie}</em> (${currentTrack.year || "?"})
  `;
}

function goToNextRound() {
  activeRound += 1;
  nextRound();
}

function finishGame() {
  stopAllMedia();
  document.getElementById("gameSection").classList.add("hidden");
  document.getElementById("endSection").classList.remove("hidden");
  document.getElementById("finalScoreText").textContent = `Score final : ${score} points sur ${totalRounds} manches.`;
}

function backToSetup() {
  stopAllMedia();
  clearInterval(timerInterval);
  document.getElementById("gameSection").classList.add("hidden");
  document.getElementById("endSection").classList.add("hidden");
  document.getElementById("setupSection").classList.remove("hidden");
}

window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem(THEME_KEY) || "sombre";
  setTheme(savedTheme);
  initRoom();
  loadTracks();
});
