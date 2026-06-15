const SWATCH_CSS = `.cm-color-swatch {
  cursor: default;
}
.cm-color-swatch::after {
  content: '';
  display: inline-block;
  width: 1cap;
  height: 1cap;
  background-color: var(--swatch-color);
  border: 1px solid rgba(0, 0, 0, 0.25);
  border-radius: 2px;
  margin-left: 4px;
  vertical-align: baseline;
}`;

// Matches hex (#rgb, #rgba, #rrggbb, #rrggbbaa) and functional notation (rgb/rgba/hsl/hsla).
// Alternation is longest-first so #rrggbbaa beats #rrggbb beats #rgb.
// [^\n)] avoids spanning multiple lines for functional notation.
const COLOR_RE =
  /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b|rgba?\s*\([^\n)]+\)|hsla?\s*\([^\n)]+\)/g;

function normalizeColor(raw: string): string {
  // For #rgb / #rgba shorthand: expand so the browser renders the swatch correctly.
  if (raw.startsWith("#") && (raw.length === 4 || raw.length === 5)) {
    const chars = raw.slice(1).split("").map((c) => c + c).join("");
    return `#${chars}`;
  }
  return raw;
}

export async function activate(context: ExtensionContext): Promise<void> {
  console.log("[color-swatches] activate: registering decoration provider");
  const disposable = sindri.editor.registerDecorationProvider("sindri.color-swatches", {
    css: SWATCH_CSS,
    provide(ctx: DecorationContext): DecorationDatum[] {
      console.log(`[color-swatches] provide: from=${ctx.from} to=${ctx.to} textLen=${ctx.text.length}`);
      const datums: DecorationDatum[] = [];
      COLOR_RE.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = COLOR_RE.exec(ctx.text)) !== null) {
        const raw = match[0];
        const color = normalizeColor(raw);
        const from = ctx.from + match.index;
        const to = from + raw.length;
        datums.push({
          kind: "mark",
          from,
          to,
          class: "cm-color-swatch",
          cssVars: { "--swatch-color": color },
        });
      }
      console.log(`[color-swatches] returning ${datums.length} datum(s)`);
      return datums;
    },
  });
  context.subscriptions.push(disposable as unknown as { dispose(): void });
}

export function deactivate(): void {}
