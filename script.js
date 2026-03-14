const SOMA_API = "https://somafm.com/channels.json";
const RADIO_BROWSER_APIS = [
  "https://de1.api.radio-browser.info",
  "https://fr1.api.radio-browser.info",
  "https://nl1.api.radio-browser.info",
];
const RADIO_BROWSER_QUERY =
  "/json/stations/search?hidebroken=true&order=clickcount&reverse=true&limit=220&tagList=electronic,techno,house,trance,ambient,drum%20and%20bass,breakbeat";

const genreOptions = ["All", "Techno", "House", "Drum & Bass", "Ambient", "Trance", "Experimental"];
const moodOptions = ["Dark", "Energetic", "Dreamy", "Hypnotic", "Euphoric"];

const moodPalette = {
  dark: { accent: "#f4a259", accent2: "#86d4c1", glow: "rgba(244, 162, 89, 0.35)" },
  energetic: { accent: "#ff8c42", accent2: "#ffcb77", glow: "rgba(255, 140, 66, 0.35)" },
  dreamy: { accent: "#9bb1ff", accent2: "#8de4d1", glow: "rgba(155, 177, 255, 0.35)" },
  hypnotic: { accent: "#7fd1b9", accent2: "#ffd17a", glow: "rgba(127, 209, 185, 0.35)" },
  euphoric: { accent: "#ff7aa2", accent2: "#9de3ff", glow: "rgba(255, 122, 162, 0.35)" },
};

const state = {
  allChannels: [],
  filtered: [],
  currentIndex: 0,
  currentChannel: null,
  currentMood: "Dark",
  currentGenre: "All",
  isPlaying: false,
  saveCount: 0,
  startedAt: performance.now(),
  lastFrame: performance.now(),
};

const root = document.documentElement;
const audio = document.getElementById("audio");
const trackTitle = document.getElementById("trackTitle");
const trackArtist = document.getElementById("trackArtist");
const stationName = document.getElementById("stationName");
const listeners = document.getElementById("listeners");
const trackGenre = document.getElementById("trackGenre");
const trackMood = document.getElementById("trackMood");
const liveState = document.getElementById("liveState");
const albumArt = document.getElementById("albumArt");
const elapsed = document.getElementById("elapsed");
const signal = document.getElementById("signal");
const saveCount = document.getElementById("saveCount");
const tuner = document.getElementById("tuner");
const tunerInfo = document.getElementById("tunerInfo");
const genreSelect = document.getElementById("genreSelect");
const moodSelect = document.getElementById("moodSelect");
const discoverList = document.getElementById("discoverList");
const meter = document.getElementById("meter");
const playBtn = document.getElementById("playBtn");
let tunerInputTimer = null;

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = String(s % 60).padStart(2, "0");
  return `${m}:${r}`;
}

function parseNowPlaying(text, fallbackTitle) {
  if (!text) return { artist: "Live stream", title: fallbackTitle };
  const parts = text.split(" - ");
  if (parts.length >= 2) {
    return { artist: parts[0].trim(), title: parts.slice(1).join(" - ").trim() };
  }
  return { artist: "Live stream", title: text.trim() };
}

function inferGenre(channel) {
  const t = `${channel.title} ${channel.description} ${channel.genre} ${channel.id}`.toLowerCase();
  if (/(techno|minimal|warehouse|industrial)/.test(t)) return "Techno";
  if (/(house|disco|groove|lounge)/.test(t)) return "House";
  if (/(drum|dnb|jungle|breakbeat|bass)/.test(t)) return "Drum & Bass";
  if (/(ambient|drone|chill|downtempo)/.test(t)) return "Ambient";
  if (/(trance|goa|psy)/.test(t)) return "Trance";
  return "Experimental";
}

function inferMood(genre, channel) {
  const t = `${channel.title} ${channel.description}`.toLowerCase();
  if (genre === "Drum & Bass") return "Energetic";
  if (genre === "Ambient") return "Dreamy";
  if (genre === "Trance") return "Euphoric";
  if (genre === "Techno") return "Hypnotic";
  if (/(dark|night|industrial|noir)/.test(t)) return "Dark";
  return "Dark";
}

function isElectronic(channel) {
  const t = `${channel.genre} ${channel.title} ${channel.description}`.toLowerCase();
  return /(electronic|techno|house|trance|ambient|downtempo|drum|dnb|bass|idm|dub|synth|breakbeat|experimental)/.test(t);
}

function normalizeSomaChannels(channels) {
  return channels.filter(isElectronic).map((c) => {
    const appGenre = inferGenre(c);
    return {
      id: `soma:${c.id}`,
      somaId: c.id,
      source: "SomaFM",
      title: c.title,
      description: c.description || "",
      genre: c.genre || "",
      appGenre,
      appMood: inferMood(appGenre, c),
      listeners: c.listeners || "",
      image: c.image || "",
      largeimage: c.largeimage || "",
      xlimage: c.xlimage || "",
      lastPlaying: c.lastPlaying || "",
      playlists: c.playlists || [],
      streamUrl: "",
    };
  });
}

function normalizeRadioBrowserChannels(channels) {
  return channels
    .map((c) => ({
      id: `rb:${c.stationuuid}`,
      source: "RadioBrowser",
      title: (c.name || "Unknown Station").trim(),
      description: c.tags || "",
      genre: c.tags || "",
      appGenre: "Experimental",
      appMood: "Dark",
      listeners: c.votes || c.clickcount || "",
      image: c.favicon || "",
      largeimage: c.favicon || "",
      xlimage: c.favicon || "",
      lastPlaying: "",
      playlists: [],
      streamUrl: c.url_resolved || c.url || "",
      bitrate: c.bitrate || 0,
      codec: c.codec || "",
      ok: c.lastcheckok === 1,
    }))
    .filter((c) => c.streamUrl && c.ok)
    .map((c) => {
      const appGenre = inferGenre(c);
      return {
        ...c,
        appGenre,
        appMood: inferMood(appGenre, c),
      };
    });
}

function dedupeAndRankChannels(channels) {
  const seen = new Set();
  const deduped = [];

  channels.forEach((channel) => {
    const key = channel.streamUrl ? channel.streamUrl.toLowerCase() : `${channel.source}:${channel.title}`.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(channel);
  });

  return deduped.sort((a, b) => {
    const sourceBoostA = a.source === "SomaFM" ? 100000 : 0;
    const sourceBoostB = b.source === "SomaFM" ? 100000 : 0;
    const qualityA = (a.bitrate || 0) + Number(a.listeners || 0) + sourceBoostA;
    const qualityB = (b.bitrate || 0) + Number(b.listeners || 0) + sourceBoostB;
    return qualityB - qualityA;
  });
}

async function fetchSomaChannels() {
  const response = await fetch(SOMA_API);
  const data = await response.json();
  return normalizeSomaChannels(data.channels || []);
}

async function fetchRadioBrowserChannels() {
  for (const base of RADIO_BROWSER_APIS) {
    try {
      const response = await fetch(`${base}${RADIO_BROWSER_QUERY}`);
      const data = await response.json();
      if (Array.isArray(data) && data.length) {
        return normalizeRadioBrowserChannels(data);
      }
    } catch (error) {
      console.error(`Radio Browser fetch failed for ${base}`, error);
    }
  }
  return [];
}

async function loadAllChannels() {
  const [soma, radioBrowser] = await Promise.allSettled([fetchSomaChannels(), fetchRadioBrowserChannels()]);
  const somaChannels = soma.status === "fulfilled" ? soma.value : [];
  const rbChannels = radioBrowser.status === "fulfilled" ? radioBrowser.value : [];
  return dedupeAndRankChannels([...somaChannels, ...rbChannels]);
}

function applyTheme(mood) {
  const key = mood.toLowerCase();
  const palette = moodPalette[key] || moodPalette.dark;
  root.style.setProperty("--accent", palette.accent);
  root.style.setProperty("--accent-2", palette.accent2);
  root.style.setProperty("--glow", palette.glow);
  document.body.setAttribute("data-mood", key);
}

function populateSelects() {
  genreSelect.innerHTML = genreOptions.map((g) => `<option value="${g}">${g}</option>`).join("");
  moodSelect.innerHTML = moodOptions.map((m) => `<option value="${m}">${m}</option>`).join("");
  genreSelect.value = state.currentGenre;
  moodSelect.value = state.currentMood;
}

function applyFilters() {
  state.filtered = state.allChannels.filter((c) => {
    const genreOk = state.currentGenre === "All" || c.appGenre === state.currentGenre;
    const moodOk = c.appMood === state.currentMood;
    return genreOk && moodOk;
  });

  if (!state.filtered.length) {
    state.filtered = state.allChannels.filter((c) => state.currentGenre === "All" || c.appGenre === state.currentGenre);
  }

  if (!state.filtered.length) {
    state.filtered = [...state.allChannels];
  }

  state.currentIndex = 0;
  updateTuner();
}

function updateTuner() {
  const max = Math.max(0, state.filtered.length - 1);
  tuner.max = String(max);
  tuner.value = String(Math.min(state.currentIndex, max));
  tunerInfo.textContent = `${state.filtered.length ? state.currentIndex + 1 : 0} / ${state.filtered.length}`;
}

function renderStation(channel) {
  if (!channel) return;
  const np = parseNowPlaying(channel.lastPlaying, channel.title);
  trackTitle.textContent = np.title;
  trackArtist.textContent = np.artist;
  stationName.textContent = `Station: ${channel.title} (${channel.source})`;
  listeners.textContent = `Listeners: ${channel.listeners || "-"}`;
  trackGenre.textContent = channel.appGenre;
  trackMood.textContent = state.currentMood;
  albumArt.src = channel.xlimage || channel.largeimage || channel.image || "";
}

async function resolveStreamUrl(channel) {
  if (channel.streamUrl) return channel.streamUrl;

  if (channel.source === "SomaFM" && channel.somaId) {
    const hosts = ["https://ice2.somafm.com", "https://ice1.somafm.com"];
    const candidates = [];

    channel.playlists.forEach((p) => {
      const match = p.url?.match(new RegExp(`/${channel.somaId}(\\d*)\\.pls`, "i"));
      const bitrate = match?.[1] || (p.format === "mp3" ? "128" : p.format === "aac" ? "64" : "");

      if (p.format === "mp3" || p.format === "aac") {
        const suffix = `${channel.somaId}-${bitrate}-${p.format}`;
        hosts.forEach((host) => candidates.push(`${host}/${suffix}`));
      }
    });

    if (candidates.length) {
      return [...new Set(candidates)][0];
    }
  }

  throw new Error("Stream URL parse failed");
}

async function tuneTo(index) {
  return tuneToWithRetry(index, Math.min(state.filtered.length, 8));
}

async function tuneToWithRetry(index, attemptsLeft) {
  if (!state.filtered.length) return;

  state.currentIndex = ((index % state.filtered.length) + state.filtered.length) % state.filtered.length;
  const channel = state.filtered[state.currentIndex];
  state.currentChannel = channel;
  updateTuner();
  renderStation(channel);
  renderDiscover();

  try {
    liveState.textContent = "BUFFERING";
    const streamUrl = await resolveStreamUrl(channel);
    audio.src = streamUrl;
    await audio.play();
    state.isPlaying = true;
    state.startedAt = performance.now();
    playBtn.textContent = "Pause";
    liveState.textContent = "LIVE";
  } catch (error) {
    state.isPlaying = false;
    playBtn.textContent = "Play";
    liveState.textContent = "SKIPPING";
    console.error(error);

    if (attemptsLeft > 1) {
      await tuneToWithRetry(state.currentIndex + 1, attemptsLeft - 1);
      return;
    }

    liveState.textContent = "ERROR";
  }
}

function renderDiscover() {
  if (!state.filtered.length) {
    discoverList.innerHTML = "";
    return;
  }

  const picks = [];
  for (let i = 1; i <= 3; i += 1) {
    const idx = (state.currentIndex + i) % state.filtered.length;
    picks.push(state.filtered[idx]);
  }

  discoverList.innerHTML = "";
  picks.forEach((c) => {
    const card = document.createElement("article");
    const title = document.createElement("strong");
    const genre = document.createElement("span");
    const meta = document.createElement("small");

    card.className = "station-card";
    card.dataset.id = c.id;
    title.textContent = c.title;
    genre.textContent = c.appGenre;
    meta.textContent = `${c.appMood} / ${c.listeners || "-"} listeners`;

    card.append(title, genre, meta);
    card.addEventListener("click", async () => {
      const idx = state.filtered.findIndex((item) => item.id === c.id);
      if (idx >= 0) await tuneTo(idx);
    });
    discoverList.appendChild(card);
  });
}

function buildMeter() {
  meter.innerHTML = "";
  for (let i = 0; i < 24; i += 1) {
    const bar = document.createElement("span");
    bar.className = "meter-bar";
    meter.appendChild(bar);
  }
}

function animateMeter(time) {
  const bars = meter.querySelectorAll(".meter-bar");
  const speed = state.isPlaying ? 1 : 0.15;
  bars.forEach((bar, i) => {
    const v = (Math.sin(i * 0.5 + time * 0.004 * speed) + Math.cos(i * 0.26 + time * 0.003 * speed) + 2) / 4;
    bar.style.height = `${6 + v * 34}px`;
    bar.style.opacity = state.isPlaying ? String(0.25 + v * 0.9) : "0.14";
  });
}

function tick(now) {
  const delta = (now - state.lastFrame) / 1000;
  state.lastFrame = now;

  if (state.isPlaying) {
    const elapsedSec = (now - state.startedAt) / 1000;
    elapsed.textContent = formatTime(elapsedSec);
    const level = Math.round(52 + ((Math.sin(now * 0.003) + 1) / 2) * 46);
    signal.textContent = `Signal ${level}%`;
  } else {
    elapsed.textContent = "0:00";
    signal.textContent = "Signal 0%";
  }

  animateMeter(now);
  requestAnimationFrame(tick);
}

async function refreshMetadata() {
  try {
    state.allChannels = await loadAllChannels();

    const currentId = state.currentChannel?.id;
    applyFilters();

    if (currentId) {
      const idx = state.filtered.findIndex((c) => c.id === currentId);
      if (idx >= 0) {
        state.currentIndex = idx;
        renderStation(state.filtered[idx]);
        updateTuner();
        renderDiscover();
      }
    }
  } catch (error) {
    console.error("Metadata refresh failed", error);
  }
}

function bindEvents() {
  document.getElementById("prevBtn").addEventListener("click", async () => {
    await tuneTo(state.currentIndex - 1);
  });

  document.getElementById("nextBtn").addEventListener("click", async () => {
    await tuneTo(state.currentIndex + 1);
  });

  playBtn.addEventListener("click", async () => {
    if (!state.currentChannel) {
      await tuneTo(0);
      return;
    }

    if (audio.paused) {
      try {
        await audio.play();
        state.isPlaying = true;
        state.startedAt = performance.now();
        playBtn.textContent = "Pause";
        liveState.textContent = "LIVE";
      } catch {
        liveState.textContent = "BLOCKED";
      }
    } else {
      audio.pause();
      state.isPlaying = false;
      playBtn.textContent = "Play";
      liveState.textContent = "PAUSED";
    }
  });

  document.getElementById("saveBtn").addEventListener("click", () => {
    state.saveCount += 1;
    saveCount.textContent = String(state.saveCount);
  });

  document.getElementById("randomBtn").addEventListener("click", async () => {
    if (!state.filtered.length) return;
    const idx = Math.floor(Math.random() * state.filtered.length);
    await tuneTo(idx);
  });

  tuner.addEventListener("input", async (event) => {
    const idx = Number(event.target.value);

    if (tunerInputTimer) clearTimeout(tunerInputTimer);
    tunerInputTimer = setTimeout(async () => {
      await tuneTo(idx);
      tunerInputTimer = null;
    }, 180);
  });

  genreSelect.addEventListener("change", async (event) => {
    state.currentGenre = event.target.value;
    applyFilters();
    await tuneTo(0);
  });

  moodSelect.addEventListener("change", async (event) => {
    state.currentMood = event.target.value;
    applyTheme(state.currentMood);
    applyFilters();
    await tuneTo(0);
  });

  audio.addEventListener("playing", () => {
    state.isPlaying = true;
    liveState.textContent = "LIVE";
    playBtn.textContent = "Pause";
  });

  audio.addEventListener("error", () => {
    state.isPlaying = false;
    liveState.textContent = "ERROR";
    playBtn.textContent = "Play";
  });

  albumArt.addEventListener("error", () => {
    albumArt.src =
      "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='640'%3E%3Crect width='100%25' height='100%25' fill='%2315120f'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23b9ad94' font-family='IBM Plex Sans, sans-serif' font-size='28'%3ENo Artwork%3C/text%3E%3C/svg%3E";
  });
}

async function init() {
  buildMeter();
  populateSelects();
  applyTheme(state.currentMood);
  bindEvents();

  try {
    state.allChannels = await loadAllChannels();
    applyFilters();

    if (!state.filtered.length) {
      trackTitle.textContent = "No stations available";
      trackArtist.textContent = "Check again later";
      return;
    }

    await tuneTo(0);
  } catch (error) {
    trackTitle.textContent = "Unable to load stations";
    trackArtist.textContent = "Network error";
    console.error(error);
  }

  setInterval(refreshMetadata, 45000);
  requestAnimationFrame(tick);
}

init();
