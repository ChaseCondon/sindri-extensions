/**
 * sindri-ferris-says — validation sample for native binary bundling (ADR-0036).
 *
 * Calls a bundled Rust binary (`ferris-says`) via sindri.env.exec() and displays
 * Ferris the crab's ASCII art in a webview panel. The binary is declared in
 * manifest.json `contributes.binaries` and resolved by the host at activation time.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function runFerris(message: string): Promise<string> {
  try {
    const result = await sindri.env.exec("ferris-says", message);
    return result.stdout || result.stderr || "(no output)";
  } catch (e) {
    return `Error running ferris-says: ${String(e)}`;
  }
}

export async function activate(context: ExtensionContext): Promise<void> {
  // Run on activation to get initial art.
  const initialArt = await runFerris("Hello from Sindri!");

  let currentArt = initialArt;

  const panel = sindri.ui.registerWebviewPanel(
    {
      id: "sindri.ferris-says",
      title: "Ferris Says",
      defaultDock: "right-bottom",
    },
    {
      getHtml(ctx) {
        return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: monospace;
    font-size: 13px;
    padding: 16px;
    background: var(--sindri-background, #1e1e1e);
    color: var(--sindri-foreground, #d4d4d4);
    height: 100vh;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  pre {
    white-space: pre;
    line-height: 1.5;
    flex: 1;
    overflow: auto;
  }
  .controls {
    display: flex;
    gap: 8px;
  }
  input {
    flex: 1;
    padding: 4px 8px;
    background: var(--sindri-input-background, #3c3c3c);
    color: var(--sindri-foreground, #d4d4d4);
    border: 1px solid var(--sindri-border, #555);
    border-radius: 3px;
    font-family: inherit;
    font-size: 13px;
  }
  button {
    padding: 4px 12px;
    background: var(--sindri-button-background, #0e639c);
    color: var(--sindri-button-foreground, #fff);
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-family: inherit;
    font-size: 13px;
  }
  button:hover { opacity: 0.9; }
</style>
</head>
<body>
<pre id="art">${escapeHtml(currentArt)}</pre>
<div class="controls">
  <input id="msg" type="text" value="Hello from Sindri!" placeholder="What should Ferris say?">
  <button onclick="speak()">Speak!</button>
</div>
<script>
  const api = window.acquireSindriApi ? window.acquireSindriApi() : null;
  function speak() {
    const msg = document.getElementById('msg').value.trim();
    if (msg && api) api.postMessage({ type: 'speak', msg });
  }
  document.getElementById('msg').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') speak();
  });
  if (api) {
    api.onDidReceiveMessage(function(data) {
      if (data && data.type === 'art') {
        document.getElementById('art').textContent = data.art;
      }
    });
  }
</script>
</body>
</html>`;
      },
      async onMessage(msg: unknown) {
        if (
          typeof msg === "object" &&
          msg !== null &&
          (msg as { type?: string }).type === "speak"
        ) {
          const text = String((msg as { msg?: unknown }).msg ?? "Hello!");
          const art = await runFerris(text);
          panel.postMessage({ type: "art", art });
        }
      },
    },
  );

  context.subscriptions.push(panel);
}
