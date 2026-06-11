# Token Counter

Counts LLM tokens (cl100k / tiktoken) in the active document and displays the count in a status bar chip. The canonical validation sample for bundled WASM module execution.

## What this example demonstrates

| API | Usage |
| --- | --- |
| `sindri.env.loadWasm` (or native `WebAssembly`) | Load and instantiate a `.wasm` file bundled in `dist/` |
| `sindri.ui.createStatusBarItem` | Display the live token count |

## Status

⏳ **Blocked on 1.5h** — WASM module execution API is not yet implemented. This folder is a scaffold. Source will be added when the WASM API ships.

## Planned implementation

The extension will bundle a compiled tiktoken WASM module, instantiate it on activation, and count tokens for the document in the active editor. The count updates on every save (or with a configurable debounce on edit). Token count is shown as a status bar item: `~1,234 tokens`.
