# sindri-now-playing

**What this sample teaches:** the minimum viable code extension. One file, no webview, no build pipeline beyond the host bundle. Use this as a template when you need to shell out and show something in the status bar.

## API demonstrated

| API | How it's used |
| --- | --- |
| `sindri.env.exec` | Calls `playerctl`, `osascript`, or PowerShell SMTC depending on platform |
| `sindri.ui.createStatusBarItem` | Creates and updates a persistent chip showing the current track |
| `sindri.commands.register` | Registers a `now-playing.refresh` command the user can trigger manually |
| `ExtensionContext.subscriptions` | Disposes the status bar item and command on deactivation |

## Why it's a useful starting point

- Under 100 lines total — easy to read in one sitting
- Shows the platform detection pattern (`process.platform` + exec fallback chain)
- Shows the polling pattern — an `setInterval` that updates a status bar chip
- No webview, no messaging, no external dependencies beyond `@sindri/api` types

## Project layout

```text
sindri-now-playing/
├── manifest.json
├── package.json        ← no runtime deps; bun types only
├── tsconfig.json
└── src/
    └── extension.ts    ← full implementation (~100 lines)
```

## Platform support

| Platform | Media source |
| --- | --- |
| macOS | `osascript` — queries the Now Playing system UI |
| Linux | `playerctl` — queries any MPRIS-compatible player |
| Windows | PowerShell SMTC (System Media Transport Controls) |

## Build

```sh
cd sindri-ide
bun run scripts/build-extension.ts ../sindri-extensions/sindri-now-playing
```

Produces `dist/extension.js` only — no webview bundle.
