# Markdown Preview

Live side-by-side Markdown preview that opens as an editor tab alongside the source file — the reference validation sample for `sindri.editor.registerEditor` (Surface B, ADR-0028).

## What this example demonstrates

| API | Usage |
| --- | --- |
| `sindri.editor.registerEditor` | Register a custom editor that opens for `.md` / `.mdx` files |
| `EditorContext.document` | Access the document content from the editor tab |
| `EditorContext.onDidChangeDocument` | Re-render when the source file changes |
| `contributes.editors[]` | Declare the file type selector in the manifest |

The key difference from `registerWebviewPanel`: this opens **in an editor tab** (the central split area, alongside code files) rather than a docked side panel. Users can split it beside the source `.md` file for a live preview experience.

## Status

⏳ **Blocked on Phase 3.3** — `sindri.editor.registerEditor` (ADR-0028 Surface B seam) is not yet implemented. This folder is a scaffold. Source will be added when the editor API ships.

## Planned implementation

The extension will register a custom editor for `*.md` and `*.mdx` files. When the user opens a Markdown file and splits the view, the preview panel renders the GFM HTML output (via a bundled parser) with syntax-highlighted code blocks. The preview re-renders on every document change with a debounce.
