# Ferris Says

Renders Ferris the crab's ASCII art speech bubble in a webview panel, powered by a bundled native Rust binary. The canonical validation sample for native binary bundling.

## What this example demonstrates

| API | Usage |
| --- | --- |
| `contributes.binaries` | Declare a platform-native binary bundled under `bin/<target>/` |
| `sindri.env.exec` (declared binary) | Call the bundled binary by its declared name — the runtime resolves the platform-correct path |
| `sindri.ui.registerWebviewPanel` | Display the ASCII art output in a dockable panel |

## Status

⏳ **Blocked on 1.5i** — native binary bundling API (`contributes.binaries` + runtime resolution) is not yet implemented. This folder is a scaffold. Source and the compiled `ferris-says` binary will be added when the native binary API ships.

## Planned implementation

The extension will ship a pre-compiled `ferris-says` binary under `bin/<target>/ferris-says[.exe]`. On activation it calls `sindri.env.exec("ferris-says", "--message", "Hello from Sindri!")`, captures stdout, and renders it in a webview panel with a monospace font.
