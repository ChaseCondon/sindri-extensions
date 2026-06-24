# Changelog — sindri.csv-grid

## v0.2.4
- Inline add/delete controls: hover-reveal `×` button on each column header to delete that column; `×` on each row to delete that row; `+` header cell adds a new column; dashed `+ row` strip at the table bottom adds a new row
- Fixed sort icons dropping to a new line (now inline in a flex header row)
- Removed `+ Row` / `+ Col` toolbar buttons (replaced by inline controls)

## v0.2.3
- Grid cells are now editable — click any cell (including headers) to edit; Enter commits, Escape cancels
- Raw view textarea is now editable (was read-only)
- Grid and Raw views stay in sync — editing one updates the other
- `+ Row` and `+ Col` buttons in the toolbar
- Removed duplicate "CSV GRID" internal header
- Removed the non-functional Clear button
- Added `serializeCSV()` to write edits back to the raw CSV text

## v0.2.2
- Added `"main": "dist/extension.js"` to the manifest — without this the marketplace could not download the extension bundle (was silently skipped)
- Extension logs now show `[csv-grid vX.Y.Z] activated` on startup for version verification

## v0.2.1
- Fixed `sindri ext build` not compiling `extension.ts` when invoked with a relative path (the generated esbuild script embedded `extDir` as a relative path that resolved incorrectly when bun ran from `sindri-ide/`)
- Verbose diagnostic logging throughout the activation and resolve pipeline

## v0.2.0
- Initial release as a custom editor (Surface B, ADR-0028)
- Opens `.csv` and `.tsv` files as a sortable, scrollable grid in an editor tab instead of the text editor
- Sortable columns (click header to toggle ascending/descending)
- Grid view and Raw view toggle
- `sindri.ui.registerEditor` — first reference implementation of the custom editor surface
