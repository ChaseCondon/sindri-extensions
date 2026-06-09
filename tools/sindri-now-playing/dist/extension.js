"use strict";
var sindri_ext = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // ../sindri-extensions/tools/sindri-now-playing/src/extension.ts
  var extension_exports = {};
  __export(extension_exports, {
    activate: () => activate,
    deactivate: () => deactivate
  });
  var SMTC_SCRIPT = `
try {
  $null = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,
           Windows.Media.Control, ContentType=WindowsRuntime]
  $mgr = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync().GetAwaiter().GetResult()
  $session = $mgr.GetCurrentSession()
  if (-not $session) { exit 0 }
  $props = $session.TryGetMediaPropertiesAsync().GetAwaiter().GetResult()
  $artist = $props.Artist; $title = $props.Title
  if ($title) { Write-Output ("\u266A " + $(if ($artist) { $artist + " - " } else { "" }) + $title) }
} catch { exit 0 }
`.trim();
  async function tryExec(cmd, ...args) {
    try {
      const r = await sindri.env.exec(cmd, ...args);
      const out = r.stdout.trim();
      return r.code === 0 && out ? out : null;
    } catch (e) {
      return null;
    }
  }
  async function fetchNowPlaying() {
    const playerctl = await tryExec("playerctl", "metadata", "--format", "\u266A {{artist}} - {{title}}");
    if (playerctl) return playerctl;
    const smtc = await tryExec("pwsh", "-NoProfile", "-Command", SMTC_SCRIPT) ?? await tryExec("powershell", "-NoProfile", "-Command", SMTC_SCRIPT);
    if (smtc) return smtc;
    const appleScript = `
    tell application "System Events"
      if exists process "Music" then
        tell application "Music"
          if player state is playing then
            return "\u266A " & artist of current track & " - " & name of current track
          end if
        end tell
      end if
      if exists process "Spotify" then
        tell application "Spotify"
          if player state is playing then
            return "\u266A " & artist of current track & " - " & name of current track
          end if
        end tell
      end if
    end tell
    return ""
  `.trim();
    const macos = await tryExec("osascript", "-e", appleScript);
    if (macos) return macos;
    return "\u266A \u2014";
  }
  async function activate(context) {
    const item = sindri.ui.createStatusBarItem("sindri.now-playing", {
      text: "\u266A \u2026",
      tooltip: "Now Playing \u2014 run 'now-playing.refresh' to update"
    });
    item.show();
    async function refresh() {
      item.text = await fetchNowPlaying();
      item.tooltip = `Now Playing \xB7 last updated ${(/* @__PURE__ */ new Date()).toLocaleTimeString()}`;
    }
    context.subscriptions.push(
      sindri.commands.register("now-playing.refresh", refresh),
      item
    );
    await refresh();
  }
  function deactivate() {
  }
  return __toCommonJS(extension_exports);
})();
//# sourceMappingURL=extension.js.map
