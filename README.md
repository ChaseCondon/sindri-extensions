# sindri-extensions

Official sample extensions for [Sindri IDE](https://github.com/sindri-ide/sindri). Each demonstrates a specific slice of the extension API — clone it, read it, and use it as a starting point.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the manifest format, full API reference, and build instructions.

---

## What's in here

### Themes and icons (data-only — no code required)

| Extension | Type | What it demonstrates |
| --- | --- | --- |
| [aurora-theme-pack](aurora-theme-pack/) | Extension Pack | Bundling a color theme + file icons + UI icons into a one-click install |
| [aurora-theme-pack/aurora-theme](aurora-theme-pack/aurora-theme/) | Color Theme | Full `ThemeDef` JSON — all `ui`, `glow`, `editor`, and `syntax` tokens |
| [aurora-theme-pack/aurora-file-icons](aurora-theme-pack/aurora-file-icons/) | File Icon Theme | `IconThemeDef` with path-referenced SVG icons |
| [aurora-theme-pack/aurora-ui-icons](aurora-theme-pack/aurora-ui-icons/) | UI Icon Theme | `UiIconPackDef` — activity bar and toolbar glyphs |
| [neon-icons](neon-icons/) | File Icon Theme | Standalone icon theme — a second `IconThemeDef` reference |
| [community-theme-collection](community-theme-collection/) | Collection | 15 community-favourite themes (Dracula, Nord, Tokyo Night, Catppuccin, …) each as a color + icon pair, all sharing a common icon base via `extends` |
| [community-theme-collection/sindri-community-icons-base](community-theme-collection/sindri-community-icons-base/) | Icon Theme Base | The shared base all community icon themes derive from — the reference implementation of icon theme inheritance (`extends` + `variables`) |

### UI extensions (code-bearing — run in the extension host)

| Extension | Status | API tier validated | What it teaches |
| --- | --- | --- | --- |
| [sindri-now-playing](sindri-now-playing/) | ✅ complete | Tier 1 | Simplest code extension: `exec` + status bar chip + command, no webview |
| [sindri-commit-streak](sindri-commit-streak/) | ✅ complete | Tier 1 + Tier 2 | Status bar chip + Svelte webview panel; bidirectional messaging |
| [sindri-csv-grid](sindri-csv-grid/) | ✅ complete | Tier 2 + resource URL | React 18 webview loaded via `sindri-resource://`; dual-build pipeline |
| [sindri-color-swatches](sindri-color-swatches/) | 🚧 scaffolded | `sindri.editor` decorator API | Inline CSS color swatch decorations — validates `sindri.editor.registerDecorationProvider` |
| [sindri-token-counter](sindri-token-counter/) | 🚧 scaffolded | WASM execution | Counts LLM tokens in the active document using a bundled WASM module |
| [sindri-ferris-says](sindri-ferris-says/) | 🚧 scaffolded | Native binary bundling + notifications | Calls a bundled Rust binary; fires a startup toast via `sindri.ui.showInformationMessage` |
| [sindri-en-gb](sindri-en-gb/) | 🚧 scaffolded | Localisation API | British English locale — validates `sindri.ui.registerLocale` |
| [sindri-rune-oracle](sindri-rune-oracle/) | 💡 planned | Input + modal API | Magic-8-ball: `showInputBox` with validation → `showMessageBox` — validates the input/modal primitives |
| [sindri-markdown-preview](sindri-markdown-preview/) | 💡 planned | Surface B (`registerEditor`) | Custom editor tab — validates `sindri.ui.registerEditor` (Phase 3) |

---

## Quick start — build a code extension

```sh
cd sindri-ide
bun run scripts/build-extension.ts ../sindri-extensions/<extension-name>
```

Output lands in `<extension-name>/dist/`. See [CONTRIBUTING.md — Code extension guide](CONTRIBUTING.md#code-extension-guide) for the full build reference.

---

## Quick start — create a derived icon theme

The fastest way to ship a community icon theme is to extend `sindri-community-icons-base` and supply only a palette. Your entire extension is a `manifest.json`:

```json
{
  "$schema": "../manifest.schema.json",
  "id": "yourname.my-icons",
  "name": "My Icons",
  "version": "1.0.0",
  "publisher": "yourname",
  "description": "My colour palette on the community icon set.",
  "categories": ["File Icon Theme"],
  "permissions": [],
  "engines": { "sindri": ">=0.1.0" },
  "extends": "sindri.community-icons-base",
  "variables": {
    "folder-base": "#5e81ac",
    "semantic-1":  "#81a1c1",
    "semantic-2":  "#a3be8c",
    "semantic-3":  "#d08770",
    "semantic-4":  "#bf616a"
  },
  "contributes": {
    "iconThemes": [
      { "id": "my-icons", "name": "My Icons", "kind": "color", "path": "icons.json" }
    ]
  }
}
```

Language icons always use their canonical brand colors — `variables` only affects folder and system file icons. See [CONTRIBUTING.md — Icon theme with inheritance](CONTRIBUTING.md#icon-theme-with-inheritance).

---

## Registry layout

`index.json` is **generated** — run `bun run scripts/build-index.ts` after adding or changing an extension. Do not edit it by hand.
