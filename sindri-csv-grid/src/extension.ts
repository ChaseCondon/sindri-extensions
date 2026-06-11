// Surface B (sindri.editor.registerEditor) is not yet implemented — blocked on Phase 3.3.
// The webview implementation (src/webview/) is complete and ready; this file will be
// wired up once the editor registration API ships.

export async function activate(_context: ExtensionContext): Promise<void> {
  // TODO Phase 3.3: replace with sindri.editor.registerEditor("sindri.csv-grid", provider)
  //
  // const provider: EditorProvider = {
  //   getHtml(_ctx: EditorContext): string {
  //     return createWebviewHtml("sindri.csv-grid");
  //   },
  // };
  // const editor = sindri.editor.registerEditor("sindri.csv-grid", provider);
  // context.subscriptions.push(editor);
}

export function deactivate(): void {}
