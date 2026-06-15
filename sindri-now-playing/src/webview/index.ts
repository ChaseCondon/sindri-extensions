// sindri-now-playing — rich player webview (vanilla TS, no framework)

interface TrackInfo {
  title: string;
  artist: string;
  album: string;
  state: "playing" | "paused" | "stopped";
  position: number;
  duration: number;
  artDataUri: string;
}

// ── DOM scaffold ──────────────────────────────────────────────────────────────

document.body.innerHTML = `
<div class="player" id="player">
  <div class="art-wrap">
    <img class="art" id="art" src="" alt="" style="display:none">
    <div class="art-placeholder" id="artPlaceholder"></div>
  </div>
  <div class="track-info">
    <div class="track-title" id="title">—</div>
    <div class="track-artist" id="artist"></div>
    <div class="track-album" id="album"></div>
  </div>
  <div class="progress-wrap">
    <div class="waveform" id="waveform">
      ${Array.from({ length: 28 }, (_, i) => `<div class="wbar" style="animation-delay:${(i * 37) % 600}ms"></div>`).join("")}
    </div>
    <input type="range" class="scrubber" id="scrubber" min="0" max="100" value="0" step="0.1">
    <div class="time-row">
      <span id="timeCurrent">0:00</span>
      <span id="timeDuration">0:00</span>
    </div>
  </div>
  <div class="controls">
    <button class="ctrl-btn" id="btnPrev" title="Previous">⏮</button>
    <button class="ctrl-btn ctrl-play" id="btnPlay" title="Play/Pause">▶</button>
    <button class="ctrl-btn" id="btnNext" title="Next">⏭</button>
  </div>
</div>
<div class="no-track" id="noTrack" style="display:none">
  <p>Nothing playing</p>
</div>
`;

// ── CSS ───────────────────────────────────────────────────────────────────────

const style = document.createElement("style");
style.textContent = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: var(--sindri-bg, #1e1e1e);
  color: var(--sindri-fg, #d4d4d4);
  font-family: var(--sindri-font-ui, system-ui, sans-serif);
  font-size: 13px;
  height: 100vh;
  overflow: hidden;
}

.player {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 20px 16px;
  gap: 14px;
  height: 100%;
}

/* Art */
.art-wrap { position: relative; width: 120px; height: 120px; flex-shrink: 0; border-radius: 8px; overflow: hidden; }
.art { width: 100%; height: 100%; object-fit: cover; border-radius: 8px; }
.art-placeholder {
  width: 100%; height: 100%;
  background: linear-gradient(135deg, var(--sindri-accent, #0af) 0%, color-mix(in srgb, var(--sindri-accent, #0af) 30%, #333) 100%);
  opacity: 0.45;
}

/* Track info */
.track-info { text-align: center; width: 100%; }
.track-title { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.track-artist { font-size: 12px; opacity: 0.7; margin-top: 3px; }
.track-album  { font-size: 11px; opacity: 0.45; margin-top: 2px; }

/* Progress + waveform */
.progress-wrap { position: relative; width: 100%; }

.waveform {
  position: absolute;
  top: -16px; left: 0; right: 0;
  height: 20px;
  display: flex;
  align-items: flex-end;
  gap: 2px;
  padding: 0 2px;
  pointer-events: none;
  opacity: 0.5;
}

.wbar {
  flex: 1;
  height: 4px;
  min-height: 2px;
  background: var(--sindri-accent, #0af);
  border-radius: 2px;
}

@keyframes wave {
  0%, 100% { height: 3px; }
  50% { height: 14px; }
}

.playing .wbar {
  animation: wave 0.7s ease-in-out infinite;
  animation-play-state: running;
}

.scrubber {
  width: 100%;
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 2px;
  background: var(--sindri-border, #444);
  outline: none;
  cursor: pointer;
}
.scrubber::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px; height: 12px;
  border-radius: 50%;
  background: var(--sindri-accent, #0af);
  cursor: pointer;
}
.scrubber::-webkit-slider-runnable-track {
  background: linear-gradient(
    to right,
    var(--sindri-accent, #0af) var(--progress, 0%),
    var(--sindri-border, #444) var(--progress, 0%)
  );
  border-radius: 2px;
}

.time-row {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  opacity: 0.5;
  margin-top: 4px;
}

/* Controls */
.controls {
  display: flex;
  gap: 12px;
  align-items: center;
}
.ctrl-btn {
  background: transparent;
  border: none;
  color: var(--sindri-fg, #ccc);
  font-size: 18px;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  line-height: 1;
  transition: opacity 0.1s;
}
.ctrl-btn:hover { opacity: 0.7; }
.ctrl-play { font-size: 24px; }

/* No-track state */
.no-track {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  opacity: 0.4;
  font-size: 13px;
}
`;
document.head.appendChild(style);

// ── State ─────────────────────────────────────────────────────────────────────

let currentInfo: TrackInfo | null = null;
let localPosition = 0;
let positionTicker: ReturnType<typeof setInterval> | null = null;
let isScrubbing = false;

const playerEl   = document.getElementById("player")!;
const noTrackEl  = document.getElementById("noTrack")!;
const artEl      = document.getElementById("art") as HTMLImageElement;
const artPh      = document.getElementById("artPlaceholder")!;
const titleEl    = document.getElementById("title")!;
const artistEl   = document.getElementById("artist")!;
const albumEl    = document.getElementById("album")!;
const waveEl     = document.getElementById("waveform")!;
const scrubber   = document.getElementById("scrubber") as HTMLInputElement;
const timeCur    = document.getElementById("timeCurrent")!;
const timeDur    = document.getElementById("timeDuration")!;
const btnPrev    = document.getElementById("btnPrev")!;
const btnPlay    = document.getElementById("btnPlay")!;
const btnNext    = document.getElementById("btnNext")!;

function fmt(sec: number): string {
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function setProgress(pos: number, dur: number): void {
  const pct = dur > 0 ? Math.min(100, (pos / dur) * 100) : 0;
  scrubber.style.setProperty("--progress", `${pct}%`);
  if (!isScrubbing) scrubber.value = String(pct);
  timeCur.textContent = fmt(pos);
  timeDur.textContent = fmt(dur);
}

function applyTrack(info: TrackInfo): void {
  playerEl.style.display = "flex";
  noTrackEl.style.display = "none";

  titleEl.textContent  = info.title  || "Unknown";
  artistEl.textContent = info.artist || "";
  albumEl.textContent  = info.album  || "";
  btnPlay.textContent  = info.state === "playing" ? "⏸" : "▶";

  if (info.state === "playing") {
    waveEl.classList.add("playing");
    playerEl.classList.add("playing");
  } else {
    waveEl.classList.remove("playing");
    playerEl.classList.remove("playing");
  }

  if (info.artDataUri) {
    artEl.src = info.artDataUri;
    artEl.style.display = "block";
    artPh.style.display = "none";
  } else {
    artEl.style.display = "none";
    artPh.style.display = "block";
  }

  localPosition = info.position;
  setProgress(localPosition, info.duration);

  if (positionTicker) clearInterval(positionTicker);
  if (info.state === "playing") {
    positionTicker = setInterval(() => {
      if (!isScrubbing && currentInfo) {
        localPosition = Math.min(localPosition + 1, currentInfo.duration);
        setProgress(localPosition, currentInfo.duration);
      }
    }, 1000);
  }
}

function showNoTrack(): void {
  playerEl.style.display = "none";
  noTrackEl.style.display = "flex";
  if (positionTicker) { clearInterval(positionTicker); positionTicker = null; }
}

// ── Controls ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const api = (window as any).acquireSindriApi?.();

function sendCtrl(action: string, position?: number): void {
  api?.postMessage({ type: "control", action, ...(position !== undefined ? { position } : {}) });
}

btnPrev.addEventListener("click", () => sendCtrl("prev"));
btnNext.addEventListener("click", () => sendCtrl("next"));
btnPlay.addEventListener("click", () => {
  if (!currentInfo) return;
  sendCtrl(currentInfo.state === "playing" ? "pause" : "play");
});

scrubber.addEventListener("mousedown", () => { isScrubbing = true; });
scrubber.addEventListener("input", () => {
  if (!currentInfo) return;
  localPosition = (parseFloat(scrubber.value) / 100) * currentInfo.duration;
  setProgress(localPosition, currentInfo.duration);
});
scrubber.addEventListener("mouseup", () => {
  isScrubbing = false;
  if (currentInfo) sendCtrl("seek", localPosition);
});

// ── API bridge ────────────────────────────────────────────────────────────────

if (api) {
  api.onMessage((msg: unknown) => {
    const m = msg as { type?: string; info?: TrackInfo };
    if (m?.type === "track" && m.info) {
      currentInfo = m.info;
      applyTrack(m.info);
    } else if (m?.type === "noTrack") {
      currentInfo = null;
      showNoTrack();
    }
  });
  api.postMessage({ type: "ready" });
} else {
  // Dev preview: show static placeholder
  applyTrack({
    title: "Sample Track", artist: "Sample Artist", album: "Sample Album",
    state: "playing", position: 42, duration: 180, artDataUri: "",
  });
}
