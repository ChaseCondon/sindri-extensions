/**
 * sindri-token-counter — validation sample for sindri.wasm.load() (ADR-0035).
 *
 * Loads a bundled Rust WASM module that approximates GPT-4 token count
 * (rule of thumb: max(charCount/4, wordCount)). Displays the count in a
 * status bar item that updates whenever the active document changes.
 */

let wasmInstance: WebAssembly.Instance | null = null;
let wasmMem: WebAssembly.Memory | null = null;
const encoder = new TextEncoder();

async function initWasm(): Promise<void> {
  const mod = await sindri.wasm.load("tokenizer.wasm");
  const result = await WebAssembly.instantiate(mod, {});
  wasmInstance = result.instance;
  wasmMem = wasmInstance.exports.memory as WebAssembly.Memory;
}

function countTokens(text: string): number {
  if (!wasmInstance || !wasmMem) return 0;
  const encoded = encoder.encode(text);
  // Grow memory if needed (WASM page = 64 KiB; start with 1 page = 65536 bytes)
  const needed = encoded.byteLength;
  const current = wasmMem.buffer.byteLength;
  if (needed > current) {
    const pages = Math.ceil((needed - current) / 65536);
    wasmMem.grow(pages);
  }
  new Uint8Array(wasmMem.buffer).set(encoded, 0);
  const fn = wasmInstance.exports.approx_tokens as (ptr: number, len: number) => number;
  return fn(0, encoded.byteLength);
}

async function updateStatusBar(
  item: ReturnType<typeof sindri.ui.createStatusBarItem>,
  doc: { getText(range?: { from: number; to: number }): Promise<string> } | undefined,
): Promise<void> {
  if (!doc) {
    item.text = "$(token) —";
    item.tooltip = "No active document";
    return;
  }
  try {
    const text = await doc.getText();
    const count = countTokens(text);
    item.text = `~${count.toLocaleString()} tokens`;
    item.tooltip = `Approximate GPT-4 token count (char/4 or word count, whichever is larger)`;
  } catch {
    item.text = "$(token) err";
    item.tooltip = "Token counter: failed to read document";
  }
}

export async function activate(context: ExtensionContext): Promise<void> {
  await initWasm();

  const bar = sindri.ui.createStatusBarItem("sindri.token-counter.bar", {
    text: "~… tokens",
    tooltip: "Loading token counter…",
  });
  bar.show();

  // Initial update for whatever is already active.
  const active = sindri.editor.activeEditor;
  await updateStatusBar(bar, active?.document);

  // Update on every active-editor switch.
  context.subscriptions.push(
    sindri.editor.onDidChangeActiveEditor(async (editor) => {
      await updateStatusBar(bar, editor?.document);
    }),
  );

  // Update on every document edit.
  context.subscriptions.push(
    sindri.editor.onDidChangeDocument(async ({ document }) => {
      // Only update if this is the active document to avoid redundant calls.
      const activeDoc = sindri.editor.activeEditor?.document;
      if (activeDoc && activeDoc.path === document.path) {
        await updateStatusBar(bar, document);
      }
    }),
  );

  context.subscriptions.push(bar);
}
