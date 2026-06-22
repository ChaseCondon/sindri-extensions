// Inline the webview HTML shell — avoids relying on @sindri/api/helpers being
// bundled correctly, since esbuild alias resolution behaves differently per build tool.
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

export function activate(): void {
  sindri.ui.registerEditor(
    "sindri.csv-grid",
    [{ pattern: "*.csv" }, { pattern: "*.tsv" }],
    {
      async resolveCustomEditor(document: CustomDocument, webview: EditorWebview): Promise<void> {
        webview.html = webviewHtml();

        webview.onMessage(async (msg: unknown) => {
          const m = msg as { type: string };
          if (m.type !== "ready") return;

          if (!document.uri) {
            webview.postMessage({ type: "noFile" });
            return;
          }

          try {
            const content = await sindri.env.fs.read(document.uri);
            webview.postMessage({ type: "file", content, path: document.uri });
          } catch {
            webview.postMessage({ type: "noFile" });
          }
        });
      },
    },
    { priority: "default" },
  );
}

export function deactivate(): void {}
