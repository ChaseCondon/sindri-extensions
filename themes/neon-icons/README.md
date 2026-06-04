# Sindri Neon Icons

A vibrant neon file icon theme for Sindri IDE. Language icons use saturated language-brand colours on dark backgrounds — instantly recognisable in the file tree at any size.

## Covered file types

| Extensions | Icon style |
| --- | --- |
| `.js` `.mjs` `.cjs` | Yellow-on-dark JavaScript |
| `.ts` `.mts` `.cts` | Blue TypeScript |
| `.jsx` | Cyan React/JSX |
| `.tsx` | Cyan TypeScript React |
| `.py` | Blue + yellow Python |
| `.rs` | Orange Rust |
| `.go` | Teal Go |
| `.json` | Green JSON braces |
| `.toml` | Amber TOML |
| `.yaml` `.yml` | Purple YAML |
| `.md` | Sky blue Markdown |
| `.css` | Blue CSS |
| `.scss` | Pink SCSS |
| `.html` `.htm` | Orange HTML |
| `.svg` | Teal SVG |
| `.sh` `.bash` | Green shell prompt |
| `.lock` | Grey lock icon |
| `.env` | Sage .env |
| `.gitignore` etc. | Red git icon |

## File structure

```text
neon-icons/
├── manifest.json      ← extension manifest
├── icons.json         ← IconThemeDef with path references
└── icons/
    ├── file.svg       ← default file fallback
    ├── folder.svg
    ├── folder-open.svg
    ├── js.svg
    ├── ts.svg
    └── ...            ← one SVG per icon ID
```

Each icon is a standalone 16×16 SVG file — the clean, maintainable approach for icon extension authors.

## Installation

Install from Settings → Extensions → Marketplace, then switch to it under Settings → Appearance → File icon theme.
