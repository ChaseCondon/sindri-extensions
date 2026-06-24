let _autoSaveEnabled = false;
let _autoSaveDelay = 1500;

function updateAutoSaveSettings() {
  _autoSaveEnabled = sindri.config.get<boolean>("editor.autoSave") ?? false;
  _autoSaveDelay = sindri.config.get<number>("editor.autoSaveDelay") ?? 1500;
}

export function activate(): void {
  // Read initial autosave settings and react to changes.
  updateAutoSaveSettings();
  sindri.config.onChange("editor.autoSave", () => updateAutoSaveSettings());
  sindri.config.onChange("editor.autoSaveDelay", () => updateAutoSaveSettings());

  sindri.ui.registerEditor(
    "sindri.csv-grid",
    [{ pattern: "*.csv" }, { pattern: "*.tsv" }],
    {
      async resolveCustomEditor(document: CustomDocument, webview: EditorWebview): Promise<void> {
        console.log('[csv-grid] resolveCustomEditor: uri=' + document.uri);
        webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="sindri-resource://sindri.csv-grid/dist/webview.css">
</head>
<body>
  <div id="root"></div>
  <script src="sindri-resource://sindri.csv-grid/dist/webview.js"></script>
</body>
</html>`;

        webview.onMessage(async (msg: unknown) => {
          const m = msg as { type: string; isDirty?: boolean; content?: string };
          console.log('[csv-grid] message from webview: type=' + m.type);

          if (m.type === 'dirty') {
            webview.isDirty = !!m.isDirty;
            return;
          }

          if (m.type === 'save' && m.content != null) {
            try {
              await sindri.env.fs.write(document.uri, m.content);
              webview.isDirty = false;
              console.log(`[csv-grid] saved: ${document.uri}`);
            } catch (err) {
              console.error('[csv-grid] save failed: ' + String(err));
            }
            return;
          }

          if (m.type === 'autoSave' && m.content != null) {
            if (!_autoSaveEnabled) return; // user has autosave off
            try {
              await sindri.env.fs.write(document.uri, m.content);
              webview.isDirty = false;
              console.log(`[csv-grid] auto-saved: ${document.uri}`);
            } catch (err) {
              console.error('[csv-grid] auto-save failed: ' + String(err));
            }
            return;
          }

          if (m.type === 'ready') {
            if (!document.uri) {
              webview.postMessage({ type: 'noFile' });
              return;
            }
            try {
              console.log('[csv-grid] reading file: ' + document.uri);
              const content = await sindri.env.fs.read(document.uri);
              console.log('[csv-grid] file read ok, length=' + content.length);
              webview.postMessage({ type: 'file', content, path: document.uri });
            } catch (err) {
              console.error('[csv-grid] failed to read file: ' + String(err));
              webview.postMessage({ type: 'noFile' });
            }
          }
        });

        // Read manifest version for Extension Logs.
        sindri.env.fs.read(sindri.env.workspaceRoot ?? '')
          .catch(() => {})
          .finally(() => {});
        const dir = (globalThis as any).__sindri_bundle_dir as string | undefined;
        if (dir) {
          sindri.env.fs.read(dir + '/../manifest.json')
            .then((raw: string) => {
              const version = (JSON.parse(raw) as { version: string }).version;
              console.log(`[csv-grid v${version}] activated`);
            })
            .catch(() => console.log('[csv-grid] activated (version unknown)'));
        }
      },
    },
    { priority: 'default' },
  );
  console.log('[csv-grid] registerEditor returned');
}

export function deactivate(): void {}
