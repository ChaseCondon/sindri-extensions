# sindri-commit-streak

**What this sample teaches:** how to use both a status bar item and a webview panel together, and how the two communicate. Use this as a starting point when your extension needs a persistent indicator in the status bar *and* a richer panel view that loads on demand.

## API demonstrated

| API | How it's used |
| --- | --- |
| `sindri.env.exec` | Runs `git log` to collect commit dates |
| `sindri.ui.createStatusBarItem` | Persistent status bar chip that shows the streak count |
| `sindri.ui.registerWebviewPanel` | Dockable panel backed by a Svelte app |
| `createWebviewHtml` (`@sindri/api/helpers`) | Generates the standard HTML shell in `getHtml()` |
| `WebviewPanelProvider.onMessage` | Waits for the `ready` signal from the webview before sending data |
| `WebviewPanel.postMessage` | Pushes `{ commits, streak }` to the webview after it signals ready |
| `sindri-resource://` URL scheme | Loads `dist/webview.js` and `dist/webview.css` into the null-origin iframe |

## Key things to notice

- **Split activation** — the status bar item is populated immediately on activate; the webview only gets data after it signals `ready`. This is the standard lazy-load pattern for webview panels.
- **One-way push** — the host sends data once; the webview renders it and doesn't request updates. For a polling pattern, see [sindri-now-playing](../sindri-now-playing/).
- **Svelte 4 webview** — demonstrates the Svelte pipeline (esbuild-svelte plugin, svelte-preprocess for TypeScript + SCSS in `.svelte` files).
- **Separated logic** — `streak.ts` is pure, has no Sindri imports, and is unit-tested independently from the extension wiring.

## Project layout

```text
sindri-commit-streak/
├── manifest.json
├── package.json          ← deps: svelte
├── tsconfig.json
├── src/
│   ├── extension.ts      ← activate(): status bar item + webview panel
│   ├── streak.ts         ← pure logic: computeStreak(dates[]) → number
│   └── webview/
│       ├── index.ts      ← entry: mount Svelte App
│       ├── styles.scss
│       ├── globals.d.ts
│       └── components/
│           ├── App.svelte         ← message listener, layout
│           └── HeatmapGrid.svelte ← 52-week contribution grid
└── tests/
    └── streak.test.ts    ← 7 unit tests for streak computation
```

## Build

```sh
cd sindri-ide
bun run scripts/build-extension.ts ../sindri-extensions/sindri-commit-streak
```

Produces `dist/extension.js`, `dist/webview.js` (Svelte IIFE), `dist/webview.css`.

## Tests

```sh
cd sindri-extensions/sindri-commit-streak
bun test
```
