# Sindri UI Icons

The default Sindri activity bar and toolbar icon set, published as a standalone extension. All icons are monochrome SVGs that adapt to the active colour theme's accent.

## Included icons

| Tool-window ID | Description |
| --- | --- |
| `explorer` | File explorer |
| `search` | Search panel |
| `git` | Source control |
| `run` | Run / play |
| `debug` | Debugger |
| `test` | Test runner |
| `extensions` | Extensions marketplace |
| `terminal` | Integrated terminal |
| `problems` | Problems panel |
| `output` | Output panel |
| `database` | Database browser |
| `remote` | Remote connections |
| `settings` | Settings |
| `containers` | Container manager |
| `snippets` | Snippets |
| `bookmarks` | Bookmarks |

## File structure

```text
sindri-ui-icons/
├── manifest.json
├── ui-pack.json       ← UiIconPackDef with path references
└── icons/
    ├── explorer.svg
    ├── search.svg
    └── ...            ← one SVG per tool-window ID
```

## Creating your own UI icon pack

Provide a `ui-pack.json` that maps tool-window IDs to SVG file paths. Icons should be 16×16 monochrome SVGs using `currentColor` so they follow the theme accent automatically.

```json
{
  "id": "yourname.my-ui-icons",
  "name": "My UI Icons",
  "kind": "mono",
  "icons": {
    "explorer": { "path": "icons/explorer.svg" },
    "search":   { "path": "icons/search.svg" }
  }
}
```

**Status:** Data-only — installs without the extension host.
