/**
 * sindri-token-counter — validation sample for sindri.wasm.load() (ADR-0035).
 *
 * Loads a bundled Rust WASM module that approximates GPT-4 token count
 * (rule of thumb: max(charCount/4, wordCount)). Displays the count in a
 * status bar item that updates whenever the active document changes.
 */

const LOG = (...a: unknown[]) => console.log("[token-counter]", ...a);
const WARN = (...a: unknown[]) => console.warn("[token-counter]", ...a);

let wasmInstance: WebAssembly.Instance | null = null;
let wasmMem: WebAssembly.Memory | null = null;
const encoder = new TextEncoder();

async function initWasm(): Promise<void> {
  LOG("loading tokenizer.wasm…");
  const mod = await sindri.wasm.load("tokenizer.wasm");
  LOG("got module:", typeof mod, mod instanceof WebAssembly.Module ? "Module" : String(mod));
  // instantiate(Module, imports) → Instance directly (not {module,instance})
  const result = await WebAssembly.instantiate(mod, {});
  // instantiate(Module) returns Instance directly; instantiate(BufferSource) returns {module,instance}
  wasmInstance = result instanceof WebAssembly.Instance ? result : (result as {instance: WebAssembly.Instance}).instance;
  wasmMem = wasmInstance.exports.memory as WebAssembly.Memory;
  LOG("WASM ready, exports:", Object.keys(wasmInstance.exports).join(", "));
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
  LOG("activating…");
  try {
    await initWasm();
  } catch (err) {
    const msg = err instanceof Error ? err.message : (err != null ? String(err) : "unknown");
    WARN("WASM init failed:", msg, err);
    return;
  }

  const bar = sindri.ui.createStatusBarItem("sindri.token-counter.bar", {
    text: "~… tokens",
    tooltip: "Loading token counter…",
  });
  bar.show();

  // Initial update — poll because activeEditor is null until the editor-state
  // bridge re-broadcasts after all extensions activate (which can take several
  // seconds: network fetch + sequential activation). Poll every 500ms, stop as
  // soon as a document is found. Safety clear at 30s to avoid a leak.
  await updateStatusBar(bar, sindri.editor.activeEditor?.document);
  let initPoll: ReturnType<typeof setInterval> | null = setInterval(async () => {
    const doc = sindri.editor.activeEditor?.document;
    if (doc) {
      if (initPoll) { clearInterval(initPoll); initPoll = null; }
      await updateStatusBar(bar, doc);
    }
  }, 500);
  const safetyTimer = setTimeout(() => {
    if (initPoll) { clearInterval(initPoll); initPoll = null; }
  }, 30_000);
  context.subscriptions.push({
    dispose() {
      if (initPoll) { clearInterval(initPoll); initPoll = null; }
      clearTimeout(safetyTimer);
    },
  });

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
