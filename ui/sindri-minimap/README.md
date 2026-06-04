# Sindri Minimap

Adds a scaled-down code overview panel to the right edge of each editor pane — the classic minimap familiar from most modern editors.

## Features

- **Pixel-accurate rendering** — the minimap mirrors the editor's exact content at reduced scale
- **Viewport highlight** — a shaded band shows the currently visible region of the file
- **Click to jump** — click anywhere in the minimap to scroll the editor to that position
- **Theme-aware** — background, text, and selection colours follow the active colour theme
- **Per-pane** — each split pane has its own independent minimap

## Configuration

```json
{
  "sindri.minimap.enabled": true,
  "sindri.minimap.width": 100,
  "sindri.minimap.renderCharacters": true,
  "sindri.minimap.maxColumn": 120
}
```

| Setting | Default | Description |
| --- | --- | --- |
| `enabled` | `true` | Show or hide the minimap |
| `width` | `100` | Width of the minimap panel in pixels |
| `renderCharacters` | `true` | Render actual character glyphs vs. coloured blocks |
| `maxColumn` | `120` | Columns beyond this are not rendered |

> **Status:** Scaffolded — requires the Sindri extension host and UI Extension API (in development).
