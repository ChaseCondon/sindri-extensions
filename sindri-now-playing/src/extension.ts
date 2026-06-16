import { createWebviewHtml } from "@sindri/api/helpers";

const LOG = (...a: unknown[]) => console.log("[now-playing]", ...a);

interface TrackInfo {
  title: string;
  artist: string;
  album: string;
  state: "playing" | "paused" | "stopped";
  position: number;   // seconds
  duration: number;   // seconds
  artDataUri: string; // "data:image/jpeg;base64,…" or ""
}

// ── Platform helpers ──────────────────────────────────────────────────────────

async function tryExec(cmd: string, ...args: string[]): Promise<{ stdout: string; code: number | null } | null> {
  try {
    const r = await sindri.env.exec(cmd, ...args);
    return r;
  } catch {
    return null;
  }
}

// macOS: query Music.app or Spotify via osascript, return pipe-delimited string
// Variable names chosen to avoid macOS 15 AppleScript reserved-word conflicts
// ('st' and 't' are single-char and trigger "Expected expression" on Darwin 25+).
const MACOS_INFO_SCRIPT = `
set output to ""
try
  if application "Music" is running then
    tell application "Music"
      if player state is playing or player state is paused then
        set psState to (player state as string)
        set trackRef to current track
        set output to psState & "|" & (name of trackRef) & "|" & (artist of trackRef) & "|" & (album of trackRef) & "|" & (round player position) & "|" & (round (duration of trackRef))
      end if
    end tell
  end if
end try
if output is "" then
  try
    if application "Spotify" is running then
      tell application "Spotify"
        if player state is playing or player state is paused then
          set psState to (player state as string)
          set trackRef to current track
          set posVal to round (player position)
          set durVal to round ((duration of trackRef) / 1000)
          set output to psState & "|" & (name of trackRef) & "|" & (artist of trackRef) & "|" & (album of trackRef) & "|" & posVal & "|" & durVal
        end if
      end tell
    end if
  end try
end if
return output
`.trim();

const MACOS_ART_SCRIPT = `
try
  tell application "Music"
    if player state is not stopped then
      set d to raw data of artwork 1 of current track
      set f to open for access "/tmp/sindri_np_art.jpg" with write permission
      set eof of f to 0
      write d to f
      close access f
      return "ok"
    end if
  end tell
end try
return ""
`.trim();

const MACOS_CTRL: Record<string, string> = {
  play:  'tell application "Music" to play',
  pause: 'tell application "Music" to pause',
  next:  'tell application "Music" to next track',
  prev:  'tell application "Music" to previous track',
};

// Windows: SMTC via PowerShell — returns pipe-delimited string
const WIN_INFO_SCRIPT = `
try {
  $null = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType=WindowsRuntime]
  $mgr = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync().GetAwaiter().GetResult()
  $session = $mgr.GetCurrentSession()
  if (-not $session) { exit 0 }
  $props = $session.TryGetMediaPropertiesAsync().GetAwaiter().GetResult()
  $tl = $session.GetTimelineProperties()
  $pb = $session.GetPlaybackInfo()
  $state = if ($pb.PlaybackStatus -eq 4) { "playing" } elseif ($pb.PlaybackStatus -eq 5) { "paused" } else { "stopped" }
  $pos = [math]::Round($tl.Position.TotalSeconds)
  $dur = [math]::Round($tl.EndTime.TotalSeconds)
  Write-Output ("$state|" + $props.Title + "|" + $props.Artist + "|" + $props.AlbumTitle + "|$pos|$dur")
} catch { exit 0 }
`.trim();

const WIN_CTRL: Record<string, string> = {
  play:  "$mgr.GetCurrentSession().TryTogglePlayPauseAsync().GetAwaiter().GetResult()",
  pause: "$mgr.GetCurrentSession().TryTogglePlayPauseAsync().GetAwaiter().GetResult()",
  next:  "$mgr.GetCurrentSession().TrySkipNextAsync().GetAwaiter().GetResult()",
  prev:  "$mgr.GetCurrentSession().TrySkipPreviousAsync().GetAwaiter().GetResult()",
};

function wrapWinCtrl(action: string): string {
  return `
try {
  $null = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType=WindowsRuntime]
  $mgr = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync().GetAwaiter().GetResult()
  ${WIN_CTRL[action] ?? ""}
} catch {}
`.trim();
}

// ── Track info fetch ──────────────────────────────────────────────────────────

// ── macOS: Spotify local web API ─────────────────────────────────────────────
// Spotify exposes a local HTTP API on port 4380 — no permissions, no external
// tools needed. curl is bundled with macOS at /usr/bin/curl.
//
// Returns:  TrackInfo if track found
//           null      if Spotify is running but nothing is playing
//           undefined if Spotify is not running (try next approach)
async function trySpotifyLocalApi(): Promise<TrackInfo | null | undefined> {
  const r = await tryExec("/usr/bin/curl", "-s", "--max-time", "1",
    "-H", "Origin: https://open.spotify.com",
    "http://localhost:4380/");
  if (!r || r.code !== 0 || !r.stdout.trim()) return undefined;
  try {
    const data = JSON.parse(r.stdout) as {
      playing?: boolean;
      running?: boolean;
      track?: {
        track_resource?: { name?: string };
        artist_resource?: { name?: string };
        album_resource?: { name?: string };
        length?: number;
      };
      playing_position?: number;
    };
    if (!data.running) return undefined;
    if (!data.track?.track_resource?.name) return null;
    return {
      title:    data.track.track_resource.name,
      artist:   data.track.artist_resource?.name ?? "",
      album:    data.track.album_resource?.name  ?? "",
      state:    data.playing ? "playing" : "paused",
      position: Math.round(data.playing_position ?? 0),
      duration: Math.round(data.track.length ?? 0),
      artDataUri: "",
    };
  } catch {
    return undefined;
  }
}

async function fetchTrackInfo(): Promise<TrackInfo | null> {
  // ── macOS ────────────────────────────────────────────────────────────────────

  // 1. Spotify local API — no permissions, no external tools (curl is built-in).
  const spotifyResult = await trySpotifyLocalApi();
  if (spotifyResult !== undefined) {
    return spotifyResult; // null = running but no track; TrackInfo = track found
  }

  // 2. AppleScript for Music.app — requires Automation permission granted once
  //    in System Settings → Privacy & Security → Automation → Sindri.
  const macRes = await tryExec("osascript", "-e", MACOS_INFO_SCRIPT);
  if (macRes && macRes.code === 0 && macRes.stdout.trim().includes("|")) {
    const [state, title, artist, album, pos, dur] = macRes.stdout.trim().split("|");
    if (title) {
      return {
        title, artist, album,
        state: (state === "playing" ? "playing" : state === "paused" ? "paused" : "stopped"),
        position: parseInt(pos) || 0,
        duration: parseInt(dur) || 0,
        artDataUri: "",
      };
    }
  } else if (macRes && macRes.code !== 0) {
    LOG("osascript:", macRes.stdout.trim() || `exit ${macRes.code}`);
  }

  // ── Windows ──────────────────────────────────────────────────────────────────
  const winRes = await tryExec("pwsh", "-NoProfile", "-Command", WIN_INFO_SCRIPT)
    ?? await tryExec("powershell", "-NoProfile", "-Command", WIN_INFO_SCRIPT);
  if (winRes && winRes.stdout.trim().includes("|")) {
    const [state, title, artist, album, pos, dur] = winRes.stdout.trim().split("|");
    if (title) {
      return {
        title, artist, album,
        state: (state as TrackInfo["state"]) ?? "stopped",
        position: parseInt(pos) || 0,
        duration: parseInt(dur) || 0,
        artDataUri: "",
      };
    }
  }

  // ── Linux ────────────────────────────────────────────────────────────────────
  const linRes = await tryExec("playerctl", "metadata", "--format",
    "{{lc(status)}}|{{title}}|{{artist}}|{{album}}|{{position}}|{{mpris:length}}");
  if (linRes && linRes.code === 0 && linRes.stdout.trim().includes("|")) {
    const [state, title, artist, album, posUs, durUs] = linRes.stdout.trim().split("|");
    if (title) {
      return {
        title, artist, album,
        state: (state === "playing" ? "playing" : state === "paused" ? "paused" : "stopped"),
        position: Math.round(parseInt(posUs) / 1_000_000) || 0,
        duration: Math.round(parseInt(durUs) / 1_000_000) || 0,
        artDataUri: "",
      };
    }
  }

  return null;
}

async function fetchAlbumArt(): Promise<string> {
  // macOS: save artwork to temp file then base64-encode
  const artRes = await tryExec("osascript", "-e", MACOS_ART_SCRIPT);
  if (artRes?.stdout.trim() === "ok") {
    const b64Res = await tryExec("base64", "-b", "0", "-i", "/tmp/sindri_np_art.jpg");
    if (b64Res?.code === 0 && b64Res.stdout.trim()) {
      return `data:image/jpeg;base64,${b64Res.stdout.trim()}`;
    }
  }
  return "";
}

// ── Player control ────────────────────────────────────────────────────────────

async function sendControl(action: string, seekPos?: number): Promise<void> {
  if (action === "seek" && seekPos !== undefined) {
    const s = Math.round(seekPos);
    await tryExec("osascript", "-e", `tell application "Music" to set player position to ${s}`);
    // Windows seek: not well-supported via SMTC
    return;
  }
  const mac = MACOS_CTRL[action];
  if (mac) { await tryExec("osascript", "-e", mac); return; }
  const winScript = wrapWinCtrl(action);
  await tryExec("pwsh", "-NoProfile", "-Command", winScript)
    ?? await tryExec("powershell", "-NoProfile", "-Command", winScript);
}

// ── Extension activation ──────────────────────────────────────────────────────

export async function activate(context: ExtensionContext): Promise<void> {
  LOG("activate v0.3.0");

  const item = sindri.ui.createStatusBarItem("sindri.now-playing.bar", {
    text: "♪ —",
    tooltip: "Now Playing",
  });
  item.show();

  let panel: WebviewPanel | undefined;
  let lastArtTitle = "";
  let lastArtUri = "";
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  async function poll(): Promise<void> {
    const info = await fetchTrackInfo();
    if (!info) {
      item.text = "♪ —";
      item.tooltip = "Now Playing — nothing playing";
      panel?.postMessage({ type: "noTrack" });
      return;
    }

    item.text = info.state === "playing"
      ? `♪ ${info.artist ? info.artist + " — " : ""}${info.title}`
      : `⏸ ${info.title}`;
    item.tooltip = `${info.title}${info.artist ? " · " + info.artist : ""}`;

    // Fetch album art only when the track changes
    if (info.title !== lastArtTitle) {
      lastArtTitle = info.title;
      lastArtUri = await fetchAlbumArt();
    }
    info.artDataUri = lastArtUri;

    panel?.postMessage({ type: "track", info });
  }

  panel = sindri.ui.registerWebviewPanel(
    { id: "sindri.now-playing", title: "Now Playing", defaultDock: "bottom" },
    {
      getHtml(_ctx: WebviewContext): string {
        return createWebviewHtml("sindri.now-playing", { css: false });
      },
      async onMessage(msg: unknown): Promise<void> {
        const m = msg as { type?: string; action?: string; position?: number };
        if (m?.type === "ready") {
          await poll();
          return;
        }
        if (m?.type === "control" && m.action) {
          await sendControl(m.action, m.position);
          // Immediate re-poll so UI reflects the change without waiting
          setTimeout(() => poll(), 300);
        }
      },
    },
  );

  context.subscriptions.push(panel, item);

  await poll();
  pollTimer = setInterval(poll, 3000);

  context.subscriptions.push({
    dispose() {
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    },
  });
}

export function deactivate(): void {}
