import { createWebviewHtml } from "@sindri/api/helpers";

export function activate(): void {
  sindri.ui.registerEditor(
    "sindri.csv-grid",
    [{ pattern: "*.csv" }, { pattern: "*.tsv" }],
    {
      async resolveCustomEditor(document: CustomDocument, webview: EditorWebview): Promise<void> {
        webview.html = createWebviewHtml("sindri.csv-grid");

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
