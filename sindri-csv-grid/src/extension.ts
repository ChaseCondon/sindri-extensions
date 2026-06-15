import { createWebviewHtml } from "@sindri/api/helpers";

export async function activate(context: ExtensionContext): Promise<void> {
  let panel: WebviewPanel | undefined;
  let lastSentPath: string | null = null;
  let lastSentVersion = -1;

  async function sendActiveFile(doc: TextDocument | undefined): Promise<void> {
    if (!panel) return;
    if (!doc) { panel.postMessage({ type: "noFile" }); return; }
    const path = doc.path ?? "";
    if (!/\.(csv|tsv)$/i.test(path)) { panel.postMessage({ type: "noFile" }); return; }
    if (path === lastSentPath && doc.version === lastSentVersion) return;
    try {
      const content = await doc.getText();
      lastSentPath = path;
      lastSentVersion = doc.version;
      panel.postMessage({ type: "file", path, content });
    } catch {
      panel.postMessage({ type: "noFile" });
    }
  }

  panel = sindri.ui.registerWebviewPanel(
    { id: "sindri.csv-grid", title: "CSV Grid", defaultDock: "bottom" },
    {
      getHtml(_ctx: WebviewContext): string {
        return createWebviewHtml("sindri.csv-grid");
      },
      async onMessage(msg: unknown): Promise<void> {
        if ((msg as { type?: string })?.type === "ready") {
          lastSentPath = null;
          lastSentVersion = -1;
          await sendActiveFile(sindri.editor.activeEditor?.document);
        }
      },
    },
  );

  context.subscriptions.push(
    panel,
    sindri.editor.onDidChangeActiveEditor(async (editor) => {
      await sendActiveFile(editor?.document);
    }),
    sindri.editor.onDidChangeDocument(async ({ document }) => {
      const active = sindri.editor.activeEditor?.document;
      if (active?.path && active.path === document.path) {
        lastSentVersion = -1;
        await sendActiveFile(document);
      }
    }),
  );
}

export function deactivate(): void {}
