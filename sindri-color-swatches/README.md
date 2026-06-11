# Color Swatches

Renders a small inline color swatch next to every CSS hex value, `rgb()`, `hsl()`, and named color in the editor — the canonical validation sample for `sindri.editor.registerDecorationProvider`.

## What this example demonstrates

| API | Usage |
| --- | --- |
| `sindri.editor.registerDecorationProvider` | Register a provider that returns `DecorationDatum[]` for each visible range |
| Decoration snapshot protocol | Receive a viewport snapshot from the host, return decorations keyed to line/column ranges |

## Status

⏳ **Blocked on 1.5g** — `sindri.editor.registerDecorationProvider` (ADR-0024 Model B) is not yet implemented. This folder is a scaffold. Source will be added when the decorator API ships.

## Planned implementation

The extension will:
1. Receive a `ViewSnapshot` (visible text lines) from the host via the decoration provider protocol
2. Run a regex over each line to find color values (`#rgb`, `#rrggbb`, `rgb(…)`, `hsl(…)`, CSS named colors)
3. Return a `DecorationDatum[]` with an inline swatch element (a small colored square) positioned after each match
4. Update on every viewport change with no debounce needed — the host batches snapshot delivery
