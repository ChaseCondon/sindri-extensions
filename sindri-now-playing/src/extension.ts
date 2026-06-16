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

// macOS AppleScript — one script per app, NO try/end try wrappers.
//
// Why no try/end try: macOS shows "Sindri wants to control Spotify/Music" the
// FIRST TIME tell application "..." runs. Wrapping in try silently swallows
// that permission request so the dialog never appears and it fails forever.
// Without try, the dialog fires on first run; the user grants it once; done.
//
// Variable names avoid macOS 15+ reserved-word conflicts ('st','t' break).
const MACOS_SPOTIFY_SCRIPT = `
if application "Spotify" is running then
  tell application "Spotify"
    if player state is playing or player state is paused then
      set psState to (player state as string)
      set trackRef to current track
      set posVal to round (player position)
      set durVal to round ((duration of trackRef) / 1000)
      return psState & "|" & (name of trackRef) & "|" & (artist of trackRef) & "|" & (album of trackRef) & "|" & posVal & "|" & durVal
    end if
  end tell
end if
return ""
`.trim();

const MACOS_MUSIC_SCRIPT = `
if application "Music" is running then
  tell application "Music"
    if player state is playing or player state is paused then
      set psState to (player state as string)
      set trackRef to current track
      return psState & "|" & (name of trackRef) & "|" & (artist of trackRef) & "|" & (album of trackRef) & "|" & (round player position) & "|" & (round (duration of trackRef))
    end if
  end tell
end if
return ""
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

const MACOS_MUSIC_CTRL: Record<string, string> = {
  play:  'tell application "Music" to play',
  pause: 'tell application "Music" to pause',
  next:  'tell application "Music" to next track',
  prev:  'tell application "Music" to previous track',
};

const MACOS_SPOTIFY_CTRL: Record<string, string> = {
  play:  'tell application "Spotify" to play',
  pause: 'tell application "Spotify" to pause',
  next:  'tell application "Spotify" to next track',
  prev:  'tell application "Spotify" to previous track',
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

function parsePipeResult(raw: string, durDivisor = 1): TrackInfo | null {
  const parts = raw.trim().split("|");
  if (parts.length < 6) return null;
  const [state, title, artist, album, pos, dur] = parts;
  if (!title) return null;
  return {
    title, artist, album,
    state: state === "playing" ? "playing" : state === "paused" ? "paused" : "stopped",
    position: parseInt(pos) || 0,
    duration: Math.round(parseInt(dur) / durDivisor) || 0,
    artDataUri: "",
  };
}

async function fetchTrackInfo(): Promise<TrackInfo | null> {
  // ── macOS ────────────────────────────────────────────────────────────────────
  // Run Spotify and Music.app as separate osascript calls so a permission
  // denial for one app doesn't block the other.

  const spotRes = await tryExec("osascript", "-e", MACOS_SPOTIFY_SCRIPT);
  if (spotRes?.code === 0 && spotRes.stdout.trim().includes("|")) {
    const info = parsePipeResult(spotRes.stdout, 1);
    if (info) return info;
  } else if (spotRes && spotRes.code !== 0) {
    LOG("Spotify AppleScript error:", spotRes.stdout.trim() || `exit ${spotRes.code}`);
  }

  const musicRes = await tryExec("osascript", "-e", MACOS_MUSIC_SCRIPT);
  if (musicRes?.code === 0 && musicRes.stdout.trim().includes("|")) {
    const info = parsePipeResult(musicRes.stdout, 1);
    if (info) return info;
  } else if (musicRes && musicRes.code !== 0) {
    LOG("Music AppleScript error:", musicRes.stdout.trim() || `exit ${musicRes.code}`);
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
    await tryExec("osascript", "-e", `tell application "Spotify" to set player position to ${s}`);
    return;
  }
  const spotCmd = MACOS_SPOTIFY_CTRL[action];
  if (spotCmd) await tryExec("osascript", "-e", spotCmd);
  const musicCmd = MACOS_MUSIC_CTRL[action];
  if (musicCmd) await tryExec("osascript", "-e", musicCmd);
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
