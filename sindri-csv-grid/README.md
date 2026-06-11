# sindri-csv-grid

**What this sample teaches:** how to build a custom file editor — an extension that opens a specific file type (`.csv`, `.tsv`) in an editor tab instead of a text view. The webview is fully implemented; the host-side wiring is waiting for Surface B (`sindri.editor.registerEditor`, Phase 3.3).

This is the reference implementation for the editor registration API. Unlike [sindri-markdown-preview](../sindri-markdown-preview/) which is purely scaffolded, this one has working UI code you can read and run today.

## Status

⏳ **Blocked on Phase 3.3** — `sindri.editor.registerEditor` (ADR-0028 Surface B) is not yet implemented. The webview (`src/webview/`) is complete. `src/extension.ts` shows the planned activation code as commented stubs.

## API demonstrated (when Surface B ships)

| API | How it's used |
| --- | --- |
| `sindri.editor.registerEditor` | Register a custom editor for `.csv` and `.tsv` files |
| `EditorContext.document` | Read the file content to parse as CSV |
| `createWebviewHtml` (`@sindri/api/helpers`) | Generate the standard HTML shell |
| `sindri-resource://` URL scheme | Serve `dist/webview.js` and `dist/webview.css` into the editor iframe |

## Key things to notice

- **Editor tab, not sidebar** — `contributes.editors` with a `.csv`/`.tsv` file selector means the IDE opens this view when you open a CSV file, like how VS Code handles image previews or notebooks.
- **Fully implemented webview** — React 18, sortable columns, RFC-4180 CSV parser, 11 unit tests. The UI is done; only the API surface is missing.
- **No host↔webview messaging** (yet) — the webview will read the document via `EditorContext.document` once the API exists. Today the input area serves as a stand-in.

## Project layout

```text
sindri-csv-grid/
├── manifest.json         ← contributes.editors with *.csv / *.tsv selector
├── package.json          ← deps: react, react-dom; devDeps: @types/react*
├── tsconfig.json
├── src/
│   ├── extension.ts      ← stubbed; shows planned registerEditor call
│   └── webview/
│       ├── index.tsx     ← entry: mount React app
│       ├── styles.scss
│       ├── globals.d.ts
│       ├── components/
│       │   ├── CsvGrid.tsx    ← root: route between input and grid views
│       │   ├── InputView.tsx  ← textarea + paste handler
│       │   └── GridView.tsx   ← sortable table
│       └── lib/
│           ├── parseCSV.ts    ← RFC-4180-compatible parser
│           └── types.ts
└── tests/
    └── parseCSV.test.ts  ← 11 unit tests
```

## Build

```sh
cd sindri-ide
bun run scripts/build-extension.ts ../sindri-extensions/sindri-csv-grid
```

## Tests

```sh
cd sindri-extensions/sindri-csv-grid
bun test
```
