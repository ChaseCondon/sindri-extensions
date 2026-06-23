function webviewHtml(): string {
  return `<!DOCTYPE html>
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
}

// Injected by the sindri host; parent directory of extension.js (i.e. dist/).
declare const __sindri_bundle_dir: string;

export function activate(): void {
  // Read and log the version so you can always verify which build is running.
  sindri.env.fs.read(__sindri_bundle_dir + '/../manifest.json')
    .then((raw: string) => {
      const version = (JSON.parse(raw) as { version: string }).version;
      console.log(`[csv-grid v${version}] activated`);
    })
    .catch(() => console.log('[csv-grid] activated (version unknown)'));
  sindri.ui.registerEditor(
    "sindri.csv-grid",
    [{ pattern: "*.csv" }, { pattern: "*.tsv" }],
    {
      async resolveCustomEditor(document: CustomDocument, webview: EditorWebview): Promise<void> {
        console.log('[csv-grid] resolveCustomEditor: uri=' + document.uri);
        webview.html = webviewHtml();
        console.log('[csv-grid] webview.html set, length=' + webview.html.length);

        webview.onMessage(async (msg: unknown) => {
          const m = msg as { type: string };
          console.log('[csv-grid] message from webview: type=' + m.type);
          if (m.type !== "ready") return;

          if (!document.uri) {
            console.warn('[csv-grid] no document.uri — sending noFile');
            webview.postMessage({ type: "noFile" });
            return;
          }

          try {
            console.log('[csv-grid] reading file: ' + document.uri);
            const content = await sindri.env.fs.read(document.uri);
            console.log('[csv-grid] file read ok, length=' + content.length);
            webview.postMessage({ type: "file", content, path: document.uri });
          } catch (err) {
            console.error('[csv-grid] failed to read file: ' + String(err));
            webview.postMessage({ type: "noFile" });
          }
        });
      },
    },
    { priority: "default" },
  );
  console.log('[csv-grid] registerEditor returned');
}

export function deactivate(): void {}
