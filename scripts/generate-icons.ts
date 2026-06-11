/**
 * generate-icons.ts — Generates the sindri-community-icons-base extension.
 *
 * Language + tool icons: canonical simple-icons brand paths (24×24 canvas).
 * Folder + semantic/system icons: CSS custom properties — child icon theme
 * extensions theme these via `variables` in their manifest (ADR-0032).
 *
 * Usage:
 *   bun run scripts/generate-icons.ts           # writes to community-theme-collection/sindri-community-icons-base
 *   bun run scripts/generate-icons.ts <out-dir> # writes to a custom directory
 */

import * as fs from "fs";
import * as path from "path";
import {
  // TypeScript / JavaScript
  siTypescript, siJavascript, siReact,
  // Python
  siPython,
  // Systems
  siRust, siGo, siCplusplus, siC, siDotnet,
  siKotlin, siSwift, siOpenjdk, siRuby, siPhp,
  siScala, siApachegroovy,
  // Scripting
  siLua, siDart, siPerl, siNim, siZig, siR,
  siCrystal, siJulia, siElm, siCoffeescript,
  // Functional
  siElixir, siErlang, siHaskell, siOcaml, siFsharp, siClojure,
  // Web
  siHtml5, siCss, siSass, siLess,
  siVuedotjs, siSvelte, siAstro, siAngular,
  // Data / binary
  siGraphql, siWebassembly, siSolidity,
  // Tool icons (brand colors, matched via fileNames)
  siVite, siJest, siVitest, siNextdotjs, siNuxt,
  siNestjs, siBun, siDeno, siNodedotjs, siStorybook,
  siElectron, siTerraform, siPrisma, siLatex,
} from "simple-icons";

// ─── Color overrides ──────────────────────────────────────────────────────────
// simple-icons brand colors that are too dark/light to render on dark backgrounds.

const OVERRIDE: Record<string, string> = {
  rs:      "#ce4a1f",  // simple-icons #000000 → recognisable Rust orange
  java:    "#ed8b00",  // siOpenjdk #000000    → Java orange
  bun:     "#f7b93e",  // simple-icons #000000 → Bun amber
  deno:    "#70ffaf",  // simple-icons #000000 → Deno green
  next:    "#a0a0a0",  // simple-icons #000000 → legible grey on dark bg
  sol:     "#607cee",  // Solidity #363636     → Ethereum blue
  lua:     "#6494c6",  // #2C2D72 too dark
  less:    "#264d7e",  // #1D365D too dark
  coffee:  "#7d5048",  // #2F2625 too dark
  crystal: "#818181",  // #000100 is black
  elixir:  "#9b59b6",  // #4B275F too dark
  prisma:  "#a0b4c8",  // #2D3748 too dark
};

// ─── CSS variable defaults ────────────────────────────────────────────────────

const DEF = {
  folder: "#6272a4",
  s1: "#64b5f6",  // blue  — docker / config / sql / infra
  s2: "#81c784",  // green — sh / env / json / yaml / build
  s3: "#ffb74d",  // orange— git / toml / img / xml / vcs
  s4: "#e57373",  // red   — lock / security
};

function fb(): string { return `var(--folder-base, ${DEF.folder})`; }
function s1(): string { return `var(--semantic-1, ${DEF.s1})`; }
function s2(): string { return `var(--semantic-2, ${DEF.s2})`; }
function s3(): string { return `var(--semantic-3, ${DEF.s3})`; }
function s4(): string { return `var(--semantic-4, ${DEF.s4})`; }

// ─── SVG helpers ──────────────────────────────────────────────────────────────

function svg24(inner: string): string {
  return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

// Wrap a simple-icons compound path as a brand icon.
function brand(icon: { path: string; hex: string }, id: string): string {
  const color = OVERRIDE[id] ?? `#${icon.hex}`;
  return svg24(`<path d="${icon.path}" fill="${color}"/>`);
}

// Badge fallback for languages without a suitable simple-icons entry.
function badge(fill: string, label: string, textFill = "white"): string {
  const fs = label.length >= 4 ? "6.5" : label.length === 3 ? "7.5" : "9";
  return svg24(
    `<rect x="2" y="2" width="20" height="20" rx="3" fill="${fill}"/>` +
    `<text x="12" y="16.5" font-size="${fs}" font-weight="900" fill="${textFill}" ` +
    `font-family="Arial,Helvetica,sans-serif" text-anchor="middle">${label}</text>`,
  );
}

// ─── Shared geometry ──────────────────────────────────────────────────────────

// Tabler folder paths — fill weight for closed, outline for open
const T_FOLDER_CLOSED = "M9 3a1 1 0 0 1 .608 .206l.1 .087l2.706 2.707h6.586a3 3 0 0 1 2.995 2.824l.005 .176v8a3 3 0 0 1 -2.824 2.995l-.176 .005h-14a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-11a3 3 0 0 1 2.824 -2.995l.176 -.005h4z";
const T_FOLDER_OPEN   = "M5 19l2.757 -7.351a1 1 0 0 1 .936 -.649h12.307a1 1 0 0 1 .986 1.164l-.996 5.211a2 2 0 0 1 -1.964 1.625h-14.026a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2h4l3 3h7a2 2 0 0 1 2 2v2";

const DOC  = "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z";
const FOLD = "M14 2v6h6";

function folderClosed(color: string): string {
  return svg24(`<path d="${T_FOLDER_CLOSED}" fill="${color}"/>`);
}
function folderOpen(color: string): string {
  return svg24(`<path d="${T_FOLDER_OPEN}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`);
}

// ─── Semantic / system icon paths (CSS-var fills) ─────────────────────────────

function mdIcon(c: string): string {
  return `<path d="M3 6h4v8l3.5-3.5L14 14V6h4v12H3z" fill="${c}"/>` +
    `<path d="M19 14.5l2 3.5-2 3.5" fill="none" stroke="${c}" stroke-width="1.5"/>` +
    `<line x1="21" y1="6" x2="21" y2="18" stroke="${c}" stroke-width="1.5"/>`;
}

function jsonIcon(c: string): string {
  return `<path d="M8 3C6 3 5.5 4 5.5 5v2c0 1-.7 1.5-1.5 1.5v3c.8 0 1.5.5 1.5 1.5v2c0 1 .5 2 2.5 2" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>` +
    `<path d="M16 3c2 0 2.5 1 2.5 2v2c0 1 .7 1.5 1.5 1.5v3c-.8 0-1.5.5-1.5 1.5v2c0 1-.5 2-2.5 2" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>`;
}

function yamlIcon(c: string): string {
  return `<line x1="5" y1="6" x2="19" y2="6" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>` +
    `<line x1="5" y1="10" x2="16" y2="10" stroke="${c}" stroke-width="1.5" stroke-linecap="round"/>` +
    `<line x1="9" y1="14" x2="19" y2="14" stroke="${c}" stroke-width="1.5" stroke-linecap="round"/>` +
    `<line x1="9" y1="18" x2="15" y2="18" stroke="${c}" stroke-width="1.5" stroke-linecap="round"/>`;
}

function tomlIcon(c: string): string {
  return `<line x1="5" y1="6" x2="19" y2="6" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>` +
    `<line x1="5" y1="10" x2="13" y2="10" stroke="${c}" stroke-width="1.5" stroke-linecap="round"/>` +
    `<line x1="5" y1="14" x2="16" y2="14" stroke="${c}" stroke-width="1.5" stroke-linecap="round"/>` +
    `<line x1="5" y1="18" x2="11" y2="18" stroke="${c}" stroke-width="1.5" stroke-linecap="round"/>`;
}

function shIcon(c: string): string {
  return `<text x="12" y="14.5" font-family="monospace,system-ui" font-size="8.5" fill="${c}" text-anchor="middle" font-weight="bold">$_</text>`;
}

function configIcon(c: string): string {
  return `<circle cx="12" cy="12" r="3.5" fill="none" stroke="${c}" stroke-width="2"/>` +
    `<circle cx="12" cy="12" r="1.2" fill="${c}"/>` +
    `<path d="M12 4.5V7M12 17v2.5M4.5 12H7M17 12h2.5M6.7 6.7l1.7 1.7M15.6 15.6l1.7 1.7M6.7 17.3l1.7-1.7M15.6 8.4l1.7-1.7" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>`;
}

function gitIcon(c: string): string {
  return `<circle cx="8" cy="5" r="2.5" fill="${c}"/>` +
    `<circle cx="17" cy="5" r="2.5" fill="${c}"/>` +
    `<circle cx="8" cy="15" r="2.5" fill="${c}"/>` +
    `<line x1="8" y1="7.5" x2="8" y2="12.5" stroke="${c}" stroke-width="1.8"/>` +
    `<path d="M17 7.5c0 4-3 7-9 6.5" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>`;
}

function dockerIcon(c: string): string {
  return `<path d="M4 10h4v2.5H4zM9 10h4v2.5H9zM4 7h4v2.5H4zM9 7h4v2.5H9zM14 7h4v2.5h-4z" fill="${c}"/>` +
    `<path d="M21 11.5c0-.8-.5-1.5-1.5-1.5H19c-.2-1-.8-1.8-1.8-2.2l-.4-.1-.3.4c-.3.5-.3 1-.1 1.4-.4-.2-1-.5-1.2-1H4.5c-.1.6-.2 1.2-.2 1.8C4.3 13.5 6 15 9 15h9.5c1.5 0 2.5-.7 2.5-2l.1-.5c.4-.1 1-.5 1-.8z" fill="${c}"/>`;
}

function lockIcon(c: string): string {
  return `<path d="M8 10V8a4 4 0 0 1 8 0v2" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"/>` +
    `<rect x="5" y="10" width="14" height="9" rx="2" fill="${c}"/>` +
    `<circle cx="12" cy="14.5" r="1.8" fill="white" opacity=".7"/>`;
}

function pkgIcon(c: string): string {
  return `<path d="M12 2L3 7v10l9 5 9-5V7z" fill="${c}" opacity=".8"/>` +
    `<path d="M12 2l9 5M12 2l-9 5M12 12v10M3 7l9 5 9-5" fill="none" stroke="${c}" stroke-width="1.2" opacity=".6"/>`;
}

function imgIcon(c: string): string {
  return `<rect x="3" y="4" width="18" height="14" rx="1.5" fill="none" stroke="${c}" stroke-width="1.8"/>` +
    `<path d="M3 12l4-4 4 3.5 4-5 6 6" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<circle cx="8.5" cy="8.5" r="1.5" fill="${c}"/>`;
}

function testIcon(c: string): string {
  return `<path d="M9 3H4a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h7" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round"/>` +
    `<circle cx="17" cy="16" r="4.5" fill="none" stroke="${c}" stroke-width="1.5"/>` +
    `<path d="M15 16l1.5 1.5 2.5-3" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
}

function licenseIcon(c: string): string {
  return `<path d="M12 2l2 4h5l-4 3 1.5 5L12 11l-4.5 3 1.5-5-4-3h5z" fill="${c}" opacity=".85"/>`;
}

function ciIcon(c: string): string {
  return `<circle cx="12" cy="12" r="9" fill="none" stroke="${c}" stroke-width="1.5"/>` +
    `<path d="M8 12l3 3 5-6" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
}

// ─── Icon set ─────────────────────────────────────────────────────────────────

function makeBaseIcons(): Record<string, string> {
  return {
    // ── Default folder (Tabler-sourced paths, CSS vars) ──────────────────
    "folder.svg":              folderClosed(fb()),
    "folder-open.svg":         folderOpen(fb()),
    // Per-type closed folders
    "folder-src.svg":          folderClosed(fb()),
    "folder-test.svg":         folderClosed(s4()),
    "folder-docs.svg":         folderClosed(s3()),
    "folder-scripts.svg":      folderClosed(s2()),
    "folder-config.svg":       folderClosed(s1()),
    "folder-assets.svg":       folderClosed(s3()),
    "folder-packages.svg":     folderClosed(s2()),
    "folder-dist.svg":         folderClosed("#6b7280"),
    "folder-design.svg":       folderClosed(s4()),
    "folder-examples.svg":     folderClosed(s2()),
    "folder-git.svg":          folderClosed(s3()),
    "folder-docker.svg":       folderClosed(s1()),
    "folder-tauri.svg":        folderClosed("#24C8D8"),
    "folder-i18n.svg":         folderClosed(s1()),
    // Per-type open folders (outline)
    "folder-src-open.svg":     folderOpen(fb()),
    "folder-test-open.svg":    folderOpen(s4()),
    "folder-docs-open.svg":    folderOpen(s3()),
    "folder-scripts-open.svg": folderOpen(s2()),
    "folder-config-open.svg":  folderOpen(s1()),
    "folder-assets-open.svg":  folderOpen(s3()),
    "folder-packages-open.svg":folderOpen(s2()),
    "folder-dist-open.svg":    folderOpen("#6b7280"),
    "folder-design-open.svg":  folderOpen(s4()),
    "folder-examples-open.svg":folderOpen(s2()),
    "folder-git-open.svg":     folderOpen(s3()),
    "folder-docker-open.svg":  folderOpen(s1()),
    "folder-tauri-open.svg":   folderOpen("#24C8D8"),
    "folder-i18n-open.svg":    folderOpen(s1()),

    // Generic file
    "file.svg": svg24(
      `<path d="${DOC}" fill="#6b7280"/>` +
      `<path d="${FOLD}" fill="none" stroke="#9ca3af" stroke-width="1.5"/>`,
    ),

    // ── Language icons — TypeScript / JavaScript ───────────────────────────
    "ts.svg":    brand(siTypescript, "ts"),
    "js.svg":    brand(siJavascript, "js"),
    "jsx.svg":   brand(siReact,      "jsx"),
    // tsx = React atom in TS blue
    "tsx.svg":   svg24(`<path d="${siReact.path}" fill="#3178c6"/>`),

    // ── Language icons — Python ────────────────────────────────────────────
    "py.svg":    brand(siPython,   "py"),

    // ── Language icons — Systems ───────────────────────────────────────────
    "rs.svg":    brand(siRust,        "rs"),
    "go.svg":    brand(siGo,          "go"),
    "cpp.svg":   brand(siCplusplus,   "cpp"),
    "c.svg":     brand(siC,           "c"),
    "cs.svg":    brand(siDotnet,      "cs"),

    // ── Language icons — JVM / mobile ──────────────────────────────────────
    "kt.svg":    brand(siKotlin,  "kt"),
    "swift.svg": brand(siSwift,   "swift"),
    "java.svg":  brand(siOpenjdk, "java"),
    "rb.svg":    brand(siRuby,    "rb"),
    "php.svg":   brand(siPhp,     "php"),
    "scala.svg": brand(siScala,   "scala"),
    "groovy.svg":brand(siApachegroovy, "groovy"),

    // ── Language icons — Scripting ─────────────────────────────────────────
    "lua.svg":    brand(siLua,         "lua"),
    "dart.svg":   brand(siDart,        "dart"),
    "perl.svg":   brand(siPerl,        "perl"),
    "nim.svg":    brand(siNim,         "nim"),
    "zig.svg":    brand(siZig,         "zig"),
    "r.svg":      brand(siR,           "r"),
    "crystal.svg":brand(siCrystal,     "crystal"),
    "julia.svg":  brand(siJulia,       "julia"),
    "elm.svg":    brand(siElm,         "elm"),
    "coffee.svg": brand(siCoffeescript,"coffee"),

    // ── Language icons — Functional ────────────────────────────────────────
    "elixir.svg": brand(siElixir,  "elixir"),
    "erlang.svg": brand(siErlang,  "erlang"),
    "haskell.svg":brand(siHaskell, "haskell"),
    "ocaml.svg":  brand(siOcaml,   "ocaml"),
    "fsharp.svg": brand(siFsharp,  "fsharp"),
    "clojure.svg":brand(siClojure, "clojure"),

    // ── Language icons — Web / markup ──────────────────────────────────────
    "html.svg":   brand(siHtml5,   "html"),
    "css.svg":    brand(siCss,     "css"),
    "scss.svg":   brand(siSass,    "scss"),
    "less.svg":   brand(siLess,    "less"),
    "vue.svg":    brand(siVuedotjs,"vue"),
    "svelte.svg": brand(siSvelte,  "svelte"),
    "astro.svg":  brand(siAstro,   "astro"),
    "angular.svg":brand(siAngular, "angular"),

    // ── Language icons — Data / query / binary ─────────────────────────────
    "graphql.svg":brand(siGraphql,    "graphql"),
    "wasm.svg":   brand(siWebassembly,"wasm"),
    "sol.svg":    brand(siSolidity,   "sol"),

    // ── Tool icons (brand colors, matched via fileNames) ───────────────────
    "vite.svg":      brand(siVite,       "vite"),
    "jest.svg":      brand(siJest,       "jest"),
    "vitest.svg":    brand(siVitest,     "vitest"),
    "next.svg":      brand(siNextdotjs,  "next"),
    "nuxt.svg":      brand(siNuxt,       "nuxt"),
    "nest.svg":      brand(siNestjs,     "nest"),
    "bun.svg":       brand(siBun,        "bun"),
    "deno.svg":      brand(siDeno,       "deno"),
    "node.svg":      brand(siNodedotjs,  "node"),
    "storybook.svg": brand(siStorybook,  "storybook"),
    "electron.svg":  brand(siElectron,   "electron"),
    "terraform.svg": brand(siTerraform,  "terraform"),
    "prisma.svg":    brand(siPrisma,     "prisma"),
    "latex.svg":     brand(siLatex,      "latex"),

    // ── Semantic/system — slot 1 (blue): docker, config, sql, svg-file, md ─
    "docker.svg": svg24(dockerIcon(s1())),
    "config.svg": svg24(configIcon(s1())),
    "sql.svg":    badge(`var(--semantic-1, ${DEF.s1})`, "SQL"),
    "svg.svg":    badge(`var(--semantic-1, ${DEF.s1})`, "SVG"),
    "md.svg":     svg24(mdIcon(s1())),

    // ── Semantic/system — slot 2 (green): sh, env, json, yaml, txt ────────
    "sh.svg":   svg24(shIcon(s2())),
    "env.svg":  badge(`var(--semantic-2, ${DEF.s2})`, ".env"),
    "json.svg": svg24(jsonIcon(s2())),
    "yaml.svg": svg24(yamlIcon(s2())),
    "txt.svg":  svg24(
      `<path d="${DOC}" fill="none" stroke="${s2()}" stroke-width="1.5"/>` +
      `<path d="${FOLD}" fill="none" stroke="${s2()}" stroke-width="1.5"/>` +
      `<line x1="8" y1="13" x2="16" y2="13" stroke="${s2()}" stroke-width="1.5" stroke-linecap="round"/>` +
      `<line x1="8" y1="16" x2="14" y2="16" stroke="${s2()}" stroke-width="1.5" stroke-linecap="round"/>`,
    ),

    // ── Semantic/system — slot 3 (orange): git, toml, img, xml ───────────
    "git.svg":  svg24(gitIcon(s3())),
    "toml.svg": svg24(tomlIcon(s3())),
    "img.svg":  svg24(imgIcon(s3())),
    "xml.svg":  badge(`var(--semantic-3, ${DEF.s3})`, "XML"),

    // ── Semantic/system — slot 4 (red): lock, pkg ─────────────────────────
    "lock.svg": svg24(lockIcon(s4())),
    "pkg.svg":  svg24(pkgIcon(s4())),

    // ── Extra semantic icons ───────────────────────────────────────────────
    "test.svg":    svg24(testIcon(s4())),
    "license.svg": svg24(licenseIcon(s3())),
    "ci.svg":      svg24(ciIcon(s2())),
  };
}

// ─── icons.json ───────────────────────────────────────────────────────────────

function makeBaseIconsJson(): object {
  const FOLDER_TYPES = [
    "src", "test", "docs", "scripts", "config", "assets",
    "packages", "dist", "design", "examples", "git", "docker", "tauri", "i18n",
  ];
  const iconIds = [
    "file", "folder", "folder-open",
    // Per-type folders (closed + open)
    ...FOLDER_TYPES.flatMap(t => [`folder-${t}`, `folder-${t}-open`]),
    // Language
    "ts", "js", "jsx", "tsx",
    "py",
    "rs", "go", "cpp", "c", "cs",
    "kt", "swift", "java", "rb", "php", "scala", "groovy",
    "lua", "dart", "perl", "nim", "zig", "r", "crystal", "julia", "elm", "coffee",
    "elixir", "erlang", "haskell", "ocaml", "fsharp", "clojure",
    "html", "css", "scss", "less", "vue", "svelte", "astro", "angular",
    "graphql", "wasm", "sol",
    // Tools
    "vite", "jest", "vitest", "next", "nuxt", "nest",
    "bun", "deno", "node", "storybook", "electron", "terraform", "prisma", "latex",
    // System
    "json", "toml", "yaml", "xml",
    "md", "svg", "txt", "img",
    "sh", "env", "lock", "git", "docker", "config", "pkg", "sql",
    "test", "license", "ci",
  ];

  return {
    id:   "sindri-community-icons-base",
    name: "Community Icons Base",
    kind: "color",
    fileExtensions: {
      // TypeScript / JavaScript
      ts: "ts", mts: "ts", cts: "ts",
      js: "js", mjs: "js", cjs: "js",
      jsx: "jsx",
      tsx: "tsx",
      // Python
      py: "py", pyw: "py", pyi: "py", ipynb: "py",
      // Systems
      rs: "rs",
      go: "go",
      cpp: "cpp", cc: "cpp", cxx: "cpp", hpp: "cpp", hxx: "cpp",
      c: "c", h: "c",
      cs: "cs", csx: "cs",
      // JVM / mobile
      kt: "kt", kts: "kt",
      swift: "swift",
      java: "java",
      rb: "rb", rake: "rb",
      php: "php", phtml: "php",
      scala: "scala", sc: "scala", sbt: "scala",
      groovy: "groovy", gvy: "groovy",
      // Scripting
      lua: "lua",
      dart: "dart",
      pl: "perl", pm: "perl",
      nim: "nim", nims: "nim",
      zig: "zig",
      r: "r", R: "r", rmd: "r",
      cr: "crystal",
      jl: "julia",
      elm: "elm",
      coffee: "coffee",
      // Functional
      ex: "elixir", exs: "elixir",
      erl: "erlang", hrl: "erlang",
      hs: "haskell", lhs: "haskell",
      ml: "ocaml", mli: "ocaml",
      fs: "fsharp", fsx: "fsharp", fsi: "fsharp",
      clj: "clojure", cljs: "clojure", cljc: "clojure", edn: "clojure",
      // Web
      html: "html", htm: "html", xhtml: "html",
      css: "css",
      scss: "scss", sass: "scss",
      less: "less",
      vue: "vue",
      svelte: "svelte",
      astro: "astro",
      // Data / query / binary
      graphql: "graphql", gql: "graphql",
      wasm: "wasm", wat: "wasm",
      sol: "sol",
      // Markup / data
      md: "md", mdx: "md", mdoc: "md", markdown: "md",
      json: "json", jsonc: "json", json5: "json",
      yaml: "yaml", yml: "yaml",
      toml: "toml",
      xml: "xml", xsl: "xml", xslt: "xml",
      svg: "svg",
      txt: "txt", log: "txt", rst: "txt",
      sql: "sql", psql: "sql",
      // LaTeX
      tex: "latex", cls: "latex", sty: "latex",
      // Images
      png: "img", jpg: "img", jpeg: "img", gif: "img",
      webp: "img", ico: "img", bmp: "img", tiff: "img", avif: "img",
      // Shell
      sh: "sh", bash: "sh", zsh: "sh", fish: "sh", ps1: "sh", psm1: "sh",
      // Infrastructure
      tf: "terraform", tfvars: "terraform",
    },
    fileNames: {
      // ── Lock files ──────────────────────────────────────────────────────
      "package-lock.json":     "lock",
      "yarn.lock":             "lock",
      "pnpm-lock.yaml":        "lock",
      "bun.lockb":             "bun",
      "Cargo.lock":            "lock",
      "Gemfile.lock":          "lock",
      "Pipfile.lock":          "lock",
      "poetry.lock":           "lock",
      "composer.lock":         "lock",
      "go.sum":                "lock",
      "mix.lock":              "lock",
      "flake.lock":            "lock",
      // ── Package manifests ───────────────────────────────────────────────
      "package.json":          "pkg",
      "package.json5":         "pkg",
      "Cargo.toml":            "toml",
      "Gemfile":               "rb",
      "Pipfile":               "py",
      "pyproject.toml":        "py",
      "setup.py":              "py",
      "setup.cfg":             "py",
      "requirements.txt":      "py",
      "requirements-dev.txt":  "py",
      "go.mod":                "go",
      "composer.json":         "php",
      "mix.exs":               "elixir",
      "build.gradle":          "groovy",
      "build.gradle.kts":      "kt",
      "settings.gradle":       "groovy",
      "settings.gradle.kts":   "kt",
      "pom.xml":               "java",
      "pubspec.yaml":          "dart",
      "dune":                  "ocaml",
      "dune-project":          "ocaml",
      "stack.yaml":            "haskell",
      "cabal.project":         "haskell",
      // ── Env / secrets ───────────────────────────────────────────────────
      ".env":              "env",
      ".env.local":        "env",
      ".env.development":  "env",
      ".env.production":   "env",
      ".env.staging":      "env",
      ".env.test":         "env",
      ".env.example":      "env",
      ".env.template":     "env",
      ".envrc":            "env",
      // ── Git ─────────────────────────────────────────────────────────────
      ".gitignore":             "git",
      ".gitattributes":         "git",
      ".gitmodules":            "git",
      ".git-blame-ignore-revs": "git",
      "COMMIT_EDITMSG":         "git",
      // ── CI / CD ─────────────────────────────────────────────────────────
      ".travis.yml":            "ci",
      ".travis.yaml":           "ci",
      "Jenkinsfile":            "ci",
      ".circleci":              "ci",
      "Makefile":               "config",
      "makefile":               "config",
      "CMakeLists.txt":         "config",
      // ── Docker ──────────────────────────────────────────────────────────
      "Dockerfile":               "docker",
      ".dockerignore":            "docker",
      "docker-compose.yml":       "docker",
      "docker-compose.yaml":      "docker",
      "docker-compose.dev.yml":   "docker",
      "docker-compose.prod.yml":  "docker",
      "docker-compose.test.yml":  "docker",
      // ── Bun ─────────────────────────────────────────────────────────────
      "bunfig.toml":       "bun",
      // ── Deno ────────────────────────────────────────────────────────────
      "deno.json":         "deno",
      "deno.jsonc":        "deno",
      "deno.lock":         "deno",
      // ── Node / npm ──────────────────────────────────────────────────────
      ".nvmrc":            "node",
      ".node-version":     "node",
      ".npmrc":            "node",
      ".yarnrc":           "node",
      ".yarnrc.yml":       "node",
      ".pnpmfile.cjs":     "node",
      "pnpm-workspace.yaml": "node",
      // ── Vite ────────────────────────────────────────────────────────────
      "vite.config.ts":    "vite",
      "vite.config.js":    "vite",
      "vite.config.mts":   "vite",
      "vite.config.mjs":   "vite",
      // ── Vitest ──────────────────────────────────────────────────────────
      "vitest.config.ts":  "vitest",
      "vitest.config.js":  "vitest",
      "vitest.config.mts": "vitest",
      // ── Jest ────────────────────────────────────────────────────────────
      "jest.config.ts":    "jest",
      "jest.config.js":    "jest",
      "jest.config.mjs":   "jest",
      "jest.config.cjs":   "jest",
      "jest.setup.ts":     "jest",
      "jest.setup.js":     "jest",
      // ── Next.js ─────────────────────────────────────────────────────────
      "next.config.js":    "next",
      "next.config.ts":    "next",
      "next.config.mjs":   "next",
      "next-env.d.ts":     "next",
      // ── Nuxt ────────────────────────────────────────────────────────────
      "nuxt.config.ts":    "nuxt",
      "nuxt.config.js":    "nuxt",
      // ── NestJS ──────────────────────────────────────────────────────────
      "nest-cli.json":     "nest",
      // ── Electron ────────────────────────────────────────────────────────
      "electron-builder.yml":  "electron",
      "electron-builder.json": "electron",
      // ── Storybook ───────────────────────────────────────────────────────
      "storybook.config.js": "storybook",
      // ── Svelte / Astro / Vue ────────────────────────────────────────────
      "svelte.config.js":    "svelte",
      "svelte.config.ts":    "svelte",
      "astro.config.mjs":    "astro",
      "astro.config.ts":     "astro",
      "astro.config.js":     "astro",
      "vue.config.js":       "vue",
      "quasar.conf.js":      "vue",
      // ── Angular ─────────────────────────────────────────────────────────
      "angular.json":        "angular",
      ".angular-cli.json":   "angular",
      // ── TypeScript / JavaScript config ──────────────────────────────────
      "tsconfig.json":       "ts",
      "tsconfig.base.json":  "ts",
      "tsconfig.app.json":   "ts",
      "tsconfig.lib.json":   "ts",
      "tsconfig.spec.json":  "ts",
      "tsconfig.test.json":  "ts",
      "tsconfig.node.json":  "ts",
      "jsconfig.json":       "js",
      // ── Prisma ──────────────────────────────────────────────────────────
      "schema.prisma":       "prisma",
      // ── Terraform / K8s ─────────────────────────────────────────────────
      "main.tf":             "terraform",
      "variables.tf":        "terraform",
      "outputs.tf":          "terraform",
      "providers.tf":        "terraform",
      "deployment.yaml":     "config",
      "kustomization.yaml":  "config",
      "Chart.yaml":          "config",
      "values.yaml":         "config",
      // ── Linting / formatting ─────────────────────────────────────────────
      ".eslintrc":           "config",
      ".eslintrc.js":        "config",
      ".eslintrc.cjs":       "config",
      ".eslintrc.json":      "config",
      ".eslintrc.yml":       "config",
      ".eslintignore":       "config",
      ".prettierrc":         "config",
      ".prettierrc.js":      "config",
      ".prettierrc.json":    "config",
      ".prettierrc.yml":     "config",
      ".prettierignore":     "config",
      ".stylelintrc":        "config",
      ".stylelintrc.json":   "config",
      ".editorconfig":       "config",
      "biome.json":          "config",
      "oxlint.json":         "config",
      // ── Build tools ─────────────────────────────────────────────────────
      "rollup.config.js":    "config",
      "rollup.config.ts":    "config",
      "rollup.config.mjs":   "config",
      "webpack.config.js":   "config",
      "webpack.config.ts":   "config",
      "esbuild.config.js":   "config",
      "esbuild.config.ts":   "config",
      // ── Monorepo tooling ─────────────────────────────────────────────────
      "turbo.json":          "config",
      "nx.json":             "config",
      "lerna.json":          "config",
      "rush.json":           "config",
      // ── Tailwind / PostCSS ───────────────────────────────────────────────
      "tailwind.config.js":  "config",
      "tailwind.config.ts":  "config",
      "tailwind.config.cjs": "config",
      "postcss.config.js":   "config",
      "postcss.config.cjs":  "config",
      // ── Misc config ─────────────────────────────────────────────────────
      "wrangler.toml":       "config",
      "capacitor.config.ts": "config",
      ".browserslistrc":     "config",
      ".babelrc":            "config",
      "babel.config.js":     "config",
      "babel.config.json":   "config",
      ".sindri.toml":        "config",
      // ── License ─────────────────────────────────────────────────────────
      "LICENSE":         "license",
      "LICENSE.md":      "license",
      "LICENSE.txt":     "license",
      "LICENCE":         "license",
      "COPYING":         "license",
      // ── Docs ────────────────────────────────────────────────────────────
      "README.md":          "md",
      "CHANGELOG.md":       "md",
      "CONTRIBUTING.md":    "md",
      "CODE_OF_CONDUCT.md": "md",
      "SECURITY.md":        "md",
      "HANDOVER.md":        "md",
    },
    folderNames: {
      // Source
      "src":           "folder-src",
      "source":        "folder-src",
      "lib":           "folder-src",
      "app":           "folder-src",
      "core":          "folder-src",
      // Test
      "test":          "folder-test",
      "tests":         "folder-test",
      "__tests__":     "folder-test",
      "spec":          "folder-test",
      "specs":         "folder-test",
      "e2e":           "folder-test",
      "fixtures":      "folder-test",
      "__fixtures__":  "folder-test",
      "__mocks__":     "folder-test",
      // Docs
      "docs":          "folder-docs",
      "documentation": "folder-docs",
      "design":        "folder-design",
      "mockups":       "folder-design",
      // Scripts
      "scripts":       "folder-scripts",
      "bin":           "folder-scripts",
      "tools":         "folder-scripts",
      // Config / VCS / tooling
      "config":        "folder-config",
      "configs":       "folder-config",
      ".git":          "folder-git",
      ".github":       "folder-git",
      ".gitlab":       "folder-git",
      ".husky":        "folder-git",
      ".idea":         "folder-config",
      ".vscode":       "folder-config",
      ".sindri":       "folder-config",
      ".storybook":    "folder-config",
      ".next":         "folder-config",
      ".nuxt":         "folder-config",
      // Assets
      "assets":        "folder-assets",
      "resources":     "folder-assets",
      "images":        "folder-assets",
      "static":        "folder-assets",
      "public":        "folder-assets",
      // Packages / deps / output
      "packages":      "folder-packages",
      "modules":       "folder-packages",
      "node_modules":  "folder-packages",
      "dist":          "folder-dist",
      "build":         "folder-dist",
      "out":           "folder-dist",
      "target":        "folder-dist",
      // Examples
      "examples":      "folder-examples",
      "demos":         "folder-examples",
      "samples":       "folder-examples",
      // Docker / infra
      "docker":        "folder-docker",
      "k8s":           "folder-docker",
      "kubernetes":    "folder-docker",
      "charts":        "folder-docker",
      "terraform":     "folder-config",
      "infra":         "folder-config",
      "infrastructure":"folder-config",
      // Tauri
      "src-tauri":     "folder-tauri",
      // i18n
      "i18n":          "folder-i18n",
      "locales":       "folder-i18n",
      "translations":  "folder-i18n",
      // Generic UI / util (use default folder)
      "components":    "folder",
      "pages":         "folder",
      "views":         "folder",
      "ui":            "folder",
      "hooks":         "folder",
      "utils":         "folder",
      "helpers":       "folder",
      "models":        "folder",
      "api":           "folder",
      "routes":        "folder",
      "handlers":      "folder",
      "controllers":   "folder",
      "services":      "folder",
      "middleware":    "folder",
      "styles":        "folder",
      "themes":        "folder",
      "types":         "folder",
      "interfaces":    "folder",
      // DB
      "prisma":        "folder",
      "migrations":    "folder",
      "seeds":         "folder",
      "sql":           "folder",
    },
    folderNamesExpanded: {
      // Source
      "src":           "folder-src-open",
      "source":        "folder-src-open",
      "lib":           "folder-src-open",
      "app":           "folder-src-open",
      "core":          "folder-src-open",
      // Test
      "test":          "folder-test-open",
      "tests":         "folder-test-open",
      "__tests__":     "folder-test-open",
      "spec":          "folder-test-open",
      "specs":         "folder-test-open",
      "e2e":           "folder-test-open",
      "fixtures":      "folder-test-open",
      "__fixtures__":  "folder-test-open",
      "__mocks__":     "folder-test-open",
      // Docs
      "docs":          "folder-docs-open",
      "documentation": "folder-docs-open",
      "design":        "folder-design-open",
      "mockups":       "folder-design-open",
      // Scripts
      "scripts":       "folder-scripts-open",
      "bin":           "folder-scripts-open",
      "tools":         "folder-scripts-open",
      // Config / VCS
      "config":        "folder-config-open",
      "configs":       "folder-config-open",
      ".git":          "folder-git-open",
      ".github":       "folder-git-open",
      ".gitlab":       "folder-git-open",
      ".husky":        "folder-git-open",
      ".idea":         "folder-config-open",
      ".vscode":       "folder-config-open",
      ".sindri":       "folder-config-open",
      ".storybook":    "folder-config-open",
      ".next":         "folder-config-open",
      ".nuxt":         "folder-config-open",
      // Assets
      "assets":        "folder-assets-open",
      "resources":     "folder-assets-open",
      "images":        "folder-assets-open",
      "static":        "folder-assets-open",
      "public":        "folder-assets-open",
      // Packages / output
      "packages":      "folder-packages-open",
      "modules":       "folder-packages-open",
      "node_modules":  "folder-packages-open",
      "dist":          "folder-dist-open",
      "build":         "folder-dist-open",
      "out":           "folder-dist-open",
      "target":        "folder-dist-open",
      // Examples
      "examples":      "folder-examples-open",
      "demos":         "folder-examples-open",
      "samples":       "folder-examples-open",
      // Docker / infra
      "docker":        "folder-docker-open",
      "k8s":           "folder-docker-open",
      "kubernetes":    "folder-docker-open",
      "charts":        "folder-docker-open",
      "terraform":     "folder-config-open",
      "infra":         "folder-config-open",
      "infrastructure":"folder-config-open",
      // Tauri
      "src-tauri":     "folder-tauri-open",
      // i18n
      "i18n":          "folder-i18n-open",
      "locales":       "folder-i18n-open",
      "translations":  "folder-i18n-open",
    },
    defaults: {
      file: "file",
      folder: "folder",
      folderOpen: "folder-open",
    },
    icons: Object.fromEntries(
      iconIds.map(n => [n, { path: `icons/${n}.svg` }]),
    ),
  };
}

// ─── Write base extension ─────────────────────────────────────────────────────

function generate(outDir: string): void {
  const iconsDir = path.join(outDir, "icons");
  fs.mkdirSync(iconsDir, { recursive: true });

  const icons = makeBaseIcons();
  for (const [name, svg] of Object.entries(icons)) {
    fs.writeFileSync(path.join(iconsDir, name), svg + "\n");
  }

  const iconsJson = JSON.stringify(makeBaseIconsJson(), null, 2);
  fs.writeFileSync(path.join(outDir, "icons.json"), iconsJson + "\n");

  console.log(`✓ ${Object.keys(icons).length} icons + icons.json → ${outDir}`);
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

const repoRoot = new URL("..", import.meta.url).pathname;
const args = process.argv.slice(2);
const defaultOut = path.join(
  repoRoot,
  "community-theme-collection",
  "sindri-community-icons-base",
);

generate(args[0] ?? defaultOut);
