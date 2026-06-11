/**
 * sindri-now-playing — shows the current media track in the status bar.
 *
 * Platform detection: tries each backend in order, falls back to "♪ —" on failure.
 *   Linux  → playerctl (MPRIS/DBus)
 *   Windows → PowerShell SMTC (GlobalSystemMediaTransportControlsSessionManager)
 *             picks up Spotify, Edge, WMP, anything using the Windows media session
 *   macOS  → osascript querying Music.app and Spotify
 *
 * V2 roadmap: full player UI panel with album art, scrubber, play/pause/skip —
 * waiting on sindri.ui.registerWebviewPanel (ADR-0026 Tier 2).
 */

// PowerShell script that queries the Windows System Media Transport Controls.
// Works on Windows 10/11 with any app that registers a media session.
const SMTC_SCRIPT = `
try {
  $null = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,
           Windows.Media.Control, ContentType=WindowsRuntime]
  $mgr = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync().GetAwaiter().GetResult()
  $session = $mgr.GetCurrentSession()
  if (-not $session) { exit 0 }
  $props = $session.TryGetMediaPropertiesAsync().GetAwaiter().GetResult()
  $artist = $props.Artist; $title = $props.Title
  if ($title) { Write-Output ("♪ " + $(if ($artist) { $artist + " - " } else { "" }) + $title) }
} catch { exit 0 }
`.trim();

async function tryExec(cmd: string, ...args: string[]): Promise<string | null> {
  try {
    const r = await sindri.env.exec(cmd, ...args);
    const out = r.stdout.trim();
    return r.code === 0 && out ? out : null;
  } catch (e: unknown) {
    // SPAWN_FAILED = binary not on PATH; anything else is unexpected, treat as no result
    return null;
  }
}

async function fetchNowPlaying(): Promise<string> {
  // Linux: MPRIS via playerctl
  const playerctl = await tryExec("playerctl", "metadata", "--format", "♪ {{artist}} - {{title}}");
  if (playerctl) return playerctl;

  // Windows: System Media Transport Controls via PowerShell
  // Try pwsh (PowerShell Core) first, fall back to powershell (Windows PowerShell)
  const smtc =
    await tryExec("pwsh", "-NoProfile", "-Command", SMTC_SCRIPT) ??
    await tryExec("powershell", "-NoProfile", "-Command", SMTC_SCRIPT);
  if (smtc) return smtc;

  // macOS: osascript querying Music.app and Spotify
  const appleScript = `
    tell application "System Events"
      if exists process "Music" then
        tell application "Music"
          if player state is playing then
            return "♪ " & artist of current track & " - " & name of current track
          end if
        end tell
      end if
      if exists process "Spotify" then
        tell application "Spotify"
          if player state is playing then
            return "♪ " & artist of current track & " - " & name of current track
          end if
        end tell
      end if
    end tell
    return ""
  `.trim();
  const macos = await tryExec("osascript", "-e", appleScript);
  if (macos) return macos;

  return "♪ —";
}

export async function activate(context: ExtensionContext): Promise<void> {
  const item = sindri.ui.createStatusBarItem("sindri.now-playing", {
    text: "♪ …",
    tooltip: "Now Playing — run 'now-playing.refresh' to update",
  });
  item.show();

  async function refresh(): Promise<void> {
    item.text = await fetchNowPlaying();
    item.tooltip = `Now Playing · last updated ${new Date().toLocaleTimeString()}`;
  }

  context.subscriptions.push(
    sindri.commands.register("now-playing.refresh", refresh) as unknown as { dispose(): void },
    item,
  );

  await refresh();
}

export function deactivate(): void {}
