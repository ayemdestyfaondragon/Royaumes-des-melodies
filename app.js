const STORAGE_KEY = "royaumes_melodies_v5";
const metaCache = {};
let loadSeq = 0;

let state = {
  players: [
    { id: 1, name: "Joueur 1", score: 0 },
    { id: 2, name: "Joueur 2", score: 0 }
  ],
  nextPlayerId: 3,
  roundNumber: 0,
  currentTrackId: null,
  revealed: false,
  playedIds: []
};

try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  if (saved && Array.isArray(saved.players) && saved.players.length) {
    state = { ...state, ...saved };
  }
} catch (_) {}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {}
}

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

// Requête JSONP universelle (contourne 100% des blocages CORS)
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

// Source 1 : iTunes FR / US via JSONP
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

// Source 2 : Deezer via JSONP
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

async function loadAndPlayTrack(track) {
  if (!track) return;
  const mySeq = ++loadSeq;

  state.roundNumber += 1;
  state.currentTrackId = track.id;
  state.revealed = false;
  if (!state.playedIds.includes(track.id)) {
    state.playedIds.push(track.id);
  }
  saveState();
  renderList();

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

coverImg.src = makeFallbackArtwork({ film: "Royaumes des Mélodies", annee: 2026 });
renderPlayers();
renderList();
