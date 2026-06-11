/**
 * generate-aurora-icons.ts — Generates aurora-file-icons and aurora-ui-icons.
 *
 * Folder + system icons: Lucide paths (elegant stroked, 24×24).
 *   Closed folders: filled  Open folders: stroked (Lucide folder-open shape)
 *   Both use consistent stroke-linecap="round" stroke-linejoin="round"
 * Language + tool icons: canonical simple-icons brand paths.
 * Palette: Aurora — deep violet, teal, rose, amber, lavender.
 *
 * Usage:
 *   bun run scripts/generate-aurora-icons.ts
 */

import * as fs from "fs";
import * as path from "path";
import {
  siTypescript, siJavascript, siReact,
  siPython,
  siRust, siGo, siCplusplus, siC, siDotnet,
  siKotlin, siSwift, siOpenjdk, siRuby, siPhp,
  siScala, siApachegroovy,
  siLua, siDart, siPerl, siNim, siZig, siR,
  siCrystal, siJulia, siElm, siCoffeescript,
  siElixir, siErlang, siHaskell, siOcaml, siFsharp, siClojure,
  siHtml5, siCss, siSass, siLess,
  siVuedotjs, siSvelte, siAstro, siAngular,
  siGraphql, siWebassembly, siSolidity,
  siVite, siJest, siVitest, siNextdotjs, siNuxt,
  siNestjs, siBun, siDeno, siNodedotjs, siStorybook,
  siElectron, siTerraform, siPrisma, siLatex,
} from "simple-icons";

// ─── Aurora palette ───────────────────────────────────────────────────────────

const A = {
  // Folder types
  src:      "#8b6fc7",  // aurora violet
  test:     "#ff4d8a",  // aurora rose
  docs:     "#e8a000",  // aurora amber
  scripts:  "#4ed9a0",  // aurora green
  config:   "#4a9eff",  // aurora blue
  assets:   "#ff8c42",  // aurora orange
  packages: "#00d4aa",  // aurora teal
  dist:     "#5a5575",  // aurora muted purple-grey
  design:   "#b45fc9",  // aurora lilac
  examples: "#4ed9a0",  // aurora green (matches scripts)
  git:      "#e8a000",  // aurora amber (matches docs)
  docker:   "#4a9eff",  // aurora blue (matches config)
  tauri:    "#24C8D8",  // Tauri brand cyan
  i18n:     "#8b6fc7",  // aurora violet (matches src)
  // System icons (fixed aurora palette)
  blue:     "#4a9eff",
  green:    "#4ed9a0",
  orange:   "#e8a000",
  red:      "#ff4d8a",
  muted:    "#7b7a9c",
  // UI icon accent
  accent:   "#9b7de8",  // aurora violet accent
};

// ─── Brand color overrides (same as community base) ───────────────────────────

const OVERRIDE: Record<string, string> = {
  rs:      "#ce4a1f",
  java:    "#ed8b00",
  bun:     "#f7b93e",
  deno:    "#70ffaf",
  next:    "#a0a0a0",
  sol:     "#607cee",
  lua:     "#6494c6",
  less:    "#264d7e",
  coffee:  "#7d5048",
  crystal: "#818181",
  elixir:  "#9b59b6",
  prisma:  "#a0b4c8",
};

// ─── SVG helpers ──────────────────────────────────────────────────────────────

function svg24(inner: string): string {
  return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

function brand(icon: { path: string; hex: string }, id: string): string {
  const color = OVERRIDE[id] ?? `#${icon.hex}`;
  return svg24(`<path d="${icon.path}" fill="${color}"/>`);
}

// ─── Lucide folder paths ──────────────────────────────────────────────────────
// Source: lucide-static v1.17.0 (ISC)

const L_FOLDER_CLOSED = "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z";
const L_FOLDER_OPEN   = "m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2";

function folderClosed(color: string): string {
  return svg24(`<path d="${L_FOLDER_CLOSED}" fill="${color}"/>`);
}
function folderOpen(color: string): string {
  return svg24(`<path d="${L_FOLDER_OPEN}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`);
}

// ─── Lucide system icon paths ─────────────────────────────────────────────────
// Each helper extracts one or two paths from the Lucide icon SVG.

function lucide(name: string): string {
  const p = path.join(import.meta.dir, `../node_modules/lucide-static/icons/${name}.svg`);
  return fs.readFileSync(p, "utf8");
}

function lucidePaths(name: string, color: string, strokeWidth = "1.5"): string {
  const src = lucide(name);
  const paths = [...src.matchAll(/<path\s[^/]*/g)].map(m => m[0]);
  const elements = paths.map(p => {
    const d = p.match(/d="([^"]+)"/)?.[1] ?? "";
    return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }).join("");
  // also pick up any <circle> and <line> elements
  const circles = [...src.matchAll(/<circle\s[^/]*/g)].map(m => {
    const cx = m[0].match(/cx="([^"]+)"/)?.[1];
    const cy = m[0].match(/cy="([^"]+)"/)?.[1];
    const r  = m[0].match(/r="([^"]+)"/)?.[1];
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${strokeWidth}"/>`;
  }).join("");
  const lines = [...src.matchAll(/<line\s[^/]*/g)].map(m => {
    const x1 = m[0].match(/x1="([^"]+)"/)?.[1];
    const y1 = m[0].match(/y1="([^"]+)"/)?.[1];
    const x2 = m[0].match(/x2="([^"]+)"/)?.[1];
    const y2 = m[0].match(/y2="([^"]+)"/)?.[1];
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/>`;
  }).join("");
  return svg24(elements + circles + lines);
}

// ─── File icon (Lucide file-text style) ──────────────────────────────────────

function fileIcon(): string {
  const c = "#6b7280";
  return svg24(
    `<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M14 2v4a2 2 0 0 0 2 2h4" fill="none" stroke="${c}" stroke-width="1.5"/>`,
  );
}

// ─── File icons ───────────────────────────────────────────────────────────────

function makeFileIcons(): Record<string, string> {
  const lp = (name: string, color: string) => lucidePaths(name, color);
  return {
    // Folders
    "folder.svg":              folderClosed(A.src),
    "folder-open.svg":         folderOpen(A.src),
    "folder-src.svg":          folderClosed(A.src),
    "folder-test.svg":         folderClosed(A.test),
    "folder-docs.svg":         folderClosed(A.docs),
    "folder-scripts.svg":      folderClosed(A.scripts),
    "folder-config.svg":       folderClosed(A.config),
    "folder-assets.svg":       folderClosed(A.assets),
    "folder-packages.svg":     folderClosed(A.packages),
    "folder-dist.svg":         folderClosed(A.dist),
    "folder-design.svg":       folderClosed(A.design),
    "folder-examples.svg":     folderClosed(A.examples),
    "folder-git.svg":          folderClosed(A.git),
    "folder-docker.svg":       folderClosed(A.docker),
    "folder-tauri.svg":        folderClosed(A.tauri),
    "folder-i18n.svg":         folderClosed(A.i18n),
    "folder-src-open.svg":     folderOpen(A.src),
    "folder-test-open.svg":    folderOpen(A.test),
    "folder-docs-open.svg":    folderOpen(A.docs),
    "folder-scripts-open.svg": folderOpen(A.scripts),
    "folder-config-open.svg":  folderOpen(A.config),
    "folder-assets-open.svg":  folderOpen(A.assets),
    "folder-packages-open.svg":folderOpen(A.packages),
    "folder-dist-open.svg":    folderOpen(A.dist),
    "folder-design-open.svg":  folderOpen(A.design),
    "folder-examples-open.svg":folderOpen(A.examples),
    "folder-git-open.svg":     folderOpen(A.git),
    "folder-docker-open.svg":  folderOpen(A.docker),
    "folder-tauri-open.svg":   folderOpen(A.tauri),
    "folder-i18n-open.svg":    folderOpen(A.i18n),

    // Generic file
    "file.svg": fileIcon(),

    // ── Language icons (simple-icons, canonical brand colors) ─────────────
    "ts.svg":    brand(siTypescript, "ts"),
    "js.svg":    brand(siJavascript, "js"),
    "jsx.svg":   brand(siReact, "jsx"),
    "tsx.svg":   svg24(`<path d="${siReact.path}" fill="#3178c6"/>`),
    "py.svg":    brand(siPython, "py"),
    "rs.svg":    brand(siRust, "rs"),
    "go.svg":    brand(siGo, "go"),
    "cpp.svg":   brand(siCplusplus, "cpp"),
    "c.svg":     brand(siC, "c"),
    "cs.svg":    brand(siDotnet, "cs"),
    "kt.svg":    brand(siKotlin, "kt"),
    "swift.svg": brand(siSwift, "swift"),
    "java.svg":  brand(siOpenjdk, "java"),
    "rb.svg":    brand(siRuby, "rb"),
    "php.svg":   brand(siPhp, "php"),
    "scala.svg": brand(siScala, "scala"),
    "groovy.svg":brand(siApachegroovy, "groovy"),
    "lua.svg":   brand(siLua, "lua"),
    "dart.svg":  brand(siDart, "dart"),
    "perl.svg":  brand(siPerl, "perl"),
    "nim.svg":   brand(siNim, "nim"),
    "zig.svg":   brand(siZig, "zig"),
    "r.svg":     brand(siR, "r"),
    "crystal.svg":brand(siCrystal, "crystal"),
    "julia.svg": brand(siJulia, "julia"),
    "elm.svg":   brand(siElm, "elm"),
    "coffee.svg":brand(siCoffeescript, "coffee"),
    "elixir.svg":brand(siElixir, "elixir"),
    "erlang.svg":brand(siErlang, "erlang"),
    "haskell.svg":brand(siHaskell, "haskell"),
    "ocaml.svg": brand(siOcaml, "ocaml"),
    "fsharp.svg":brand(siFsharp, "fsharp"),
    "clojure.svg":brand(siClojure, "clojure"),
    "html.svg":  brand(siHtml5, "html"),
    "css.svg":   brand(siCss, "css"),
    "scss.svg":  brand(siSass, "scss"),
    "less.svg":  brand(siLess, "less"),
    "vue.svg":   brand(siVuedotjs, "vue"),
    "svelte.svg":brand(siSvelte, "svelte"),
    "astro.svg": brand(siAstro, "astro"),
    "angular.svg":brand(siAngular, "angular"),
    "graphql.svg":brand(siGraphql, "graphql"),
    "wasm.svg":  brand(siWebassembly, "wasm"),
    "sol.svg":   brand(siSolidity, "sol"),
    // Tool icons
    "vite.svg":     brand(siVite, "vite"),
    "jest.svg":     brand(siJest, "jest"),
    "vitest.svg":   brand(siVitest, "vitest"),
    "next.svg":     brand(siNextdotjs, "next"),
    "nuxt.svg":     brand(siNuxt, "nuxt"),
    "nest.svg":     brand(siNestjs, "nest"),
    "bun.svg":      brand(siBun, "bun"),
    "deno.svg":     brand(siDeno, "deno"),
    "node.svg":     brand(siNodedotjs, "node"),
    "storybook.svg":brand(siStorybook, "storybook"),
    "electron.svg": brand(siElectron, "electron"),
    "terraform.svg":brand(siTerraform, "terraform"),
    "prisma.svg":   brand(siPrisma, "prisma"),
    "latex.svg":    brand(siLatex, "latex"),

    // ── System icons (Lucide paths, aurora palette) ───────────────────────
    "git.svg":     lp("git-branch",    A.orange),
    "docker.svg":  lp("container",     A.blue),
    "config.svg":  lp("settings-2",    A.blue),
    "lock.svg":    lp("lock",          A.red),
    "pkg.svg":     lp("package",       A.green),
    "sh.svg":      lp("terminal",      A.green),
    "env.svg":     lp("key-round",     A.green),
    "json.svg":    lp("braces",        A.green),
    "yaml.svg":    lp("align-left",    A.green),
    "toml.svg":    lp("list",          A.orange),
    "xml.svg":     lp("code",          A.orange),
    "svg.svg":     lp("shapes",        A.blue),
    "txt.svg":     lp("file-text",     A.green),
    "img.svg":     lp("image",         A.blue),
    "sql.svg":     lp("database",      A.blue),
    "md.svg":      lp("book-open",     A.orange),
    "test.svg":    lp("flask-conical", A.red),
    "license.svg": lp("award",         A.orange),
    "ci.svg":      lp("repeat-2",      A.green),
  };
}

// ─── icons.json ───────────────────────────────────────────────────────────────

function makeFileIconsJson(): object {
  const FOLDER_TYPES = [
    "src", "test", "docs", "scripts", "config", "assets",
    "packages", "dist", "design", "examples", "git", "docker", "tauri", "i18n",
  ];
  const all = [
    "file", "folder", "folder-open",
    ...FOLDER_TYPES.flatMap(t => [`folder-${t}`, `folder-${t}-open`]),
    "ts", "js", "jsx", "tsx", "py",
    "rs", "go", "cpp", "c", "cs",
    "kt", "swift", "java", "rb", "php", "scala", "groovy",
    "lua", "dart", "perl", "nim", "zig", "r", "crystal", "julia", "elm", "coffee",
    "elixir", "erlang", "haskell", "ocaml", "fsharp", "clojure",
    "html", "css", "scss", "less", "vue", "svelte", "astro", "angular",
    "graphql", "wasm", "sol",
    "vite", "jest", "vitest", "next", "nuxt", "nest",
    "bun", "deno", "node", "storybook", "electron", "terraform", "prisma", "latex",
    "json", "toml", "yaml", "xml", "md", "svg", "txt", "img", "sh", "env",
    "lock", "git", "docker", "config", "pkg", "sql", "test", "license", "ci",
  ];

  return {
    id:   "sindri-aurora-file-icons",
    name: "Aurora File Icons",
    kind: "color",
    fileExtensions: {
      ts: "ts", mts: "ts", cts: "ts",
      js: "js", mjs: "js", cjs: "js",
      jsx: "jsx", tsx: "tsx",
      py: "py", pyw: "py", pyi: "py", ipynb: "py",
      rs: "rs",
      go: "go",
      cpp: "cpp", cc: "cpp", cxx: "cpp", hpp: "cpp", hxx: "cpp",
      c: "c", h: "c",
      cs: "cs", csx: "cs",
      kt: "kt", kts: "kt",
      swift: "swift",
      java: "java",
      rb: "rb", rake: "rb",
      php: "php", phtml: "php",
      scala: "scala", sc: "scala", sbt: "scala",
      groovy: "groovy", gvy: "groovy",
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
      ex: "elixir", exs: "elixir",
      erl: "erlang", hrl: "erlang",
      hs: "haskell", lhs: "haskell",
      ml: "ocaml", mli: "ocaml",
      fs: "fsharp", fsx: "fsharp", fsi: "fsharp",
      clj: "clojure", cljs: "clojure", cljc: "clojure", edn: "clojure",
      html: "html", htm: "html", xhtml: "html",
      css: "css",
      scss: "scss", sass: "scss",
      less: "less",
      vue: "vue",
      svelte: "svelte",
      astro: "astro",
      graphql: "graphql", gql: "graphql",
      wasm: "wasm", wat: "wasm",
      sol: "sol",
      md: "md", mdx: "md", mdoc: "md", markdown: "md",
      json: "json", jsonc: "json", json5: "json",
      yaml: "yaml", yml: "yaml",
      toml: "toml",
      xml: "xml", xsl: "xml", xslt: "xml",
      svg: "svg",
      txt: "txt", log: "txt", rst: "txt",
      sql: "sql", psql: "sql",
      tex: "latex", cls: "latex", sty: "latex",
      png: "img", jpg: "img", jpeg: "img", gif: "img",
      webp: "img", ico: "img", bmp: "img", tiff: "img", avif: "img",
      sh: "sh", bash: "sh", zsh: "sh", fish: "sh", ps1: "sh", psm1: "sh",
      tf: "terraform", tfvars: "terraform",
    },
    fileNames: {
      "package-lock.json": "lock", "yarn.lock": "lock", "pnpm-lock.yaml": "lock",
      "bun.lockb": "bun", "Cargo.lock": "lock", "Gemfile.lock": "lock",
      "poetry.lock": "lock", "go.sum": "lock", "mix.lock": "lock",
      "package.json": "pkg", "Cargo.toml": "toml",
      "go.mod": "go", "pyproject.toml": "py",
      "pubspec.yaml": "dart", "mix.exs": "elixir",
      "build.gradle": "groovy", "build.gradle.kts": "kt",
      "pom.xml": "java",
      ".env": "env", ".env.local": "env", ".env.production": "env",
      ".env.development": "env", ".env.example": "env", ".envrc": "env",
      ".gitignore": "git", ".gitattributes": "git", ".gitmodules": "git",
      "Dockerfile": "docker", ".dockerignore": "docker",
      "docker-compose.yml": "docker", "docker-compose.yaml": "docker",
      "deno.json": "deno", "deno.jsonc": "deno", "bunfig.toml": "bun",
      ".nvmrc": "node", ".npmrc": "node",
      "vite.config.ts": "vite", "vite.config.js": "vite", "vite.config.mjs": "vite",
      "vitest.config.ts": "vitest", "vitest.config.js": "vitest",
      "jest.config.ts": "jest", "jest.config.js": "jest",
      "next.config.js": "next", "next.config.ts": "next", "next.config.mjs": "next",
      "nuxt.config.ts": "nuxt", "nuxt.config.js": "nuxt",
      "nest-cli.json": "nest",
      "svelte.config.js": "svelte", "svelte.config.ts": "svelte",
      "astro.config.mjs": "astro", "astro.config.ts": "astro",
      "astro.config.js": "astro",
      "angular.json": "angular",
      "tsconfig.json": "ts", "tsconfig.base.json": "ts",
      "jsconfig.json": "js",
      "schema.prisma": "prisma",
      "main.tf": "terraform", "variables.tf": "terraform",
      ".eslintrc": "config", ".eslintrc.json": "config", ".eslintrc.js": "config",
      ".prettierrc": "config", ".prettierrc.json": "config", ".editorconfig": "config",
      "biome.json": "config", "tailwind.config.js": "config", "tailwind.config.ts": "config",
      "turbo.json": "config", "nx.json": "config",
      "LICENSE": "license", "LICENSE.md": "license", "COPYING": "license",
      "README.md": "md", "CHANGELOG.md": "md", "CONTRIBUTING.md": "md",
      "SECURITY.md": "md", "HANDOVER.md": "md",
    },
    folderNames: {
      "src": "folder-src", "source": "folder-src", "lib": "folder-src",
      "app": "folder-src", "core": "folder-src",
      "test": "folder-test", "tests": "folder-test",
      "__tests__": "folder-test", "spec": "folder-test",
      "specs": "folder-test", "e2e": "folder-test",
      "fixtures": "folder-test", "__mocks__": "folder-test",
      "docs": "folder-docs", "documentation": "folder-docs",
      "design": "folder-design", "mockups": "folder-design",
      "scripts": "folder-scripts", "bin": "folder-scripts", "tools": "folder-scripts",
      "config": "folder-config", "configs": "folder-config",
      ".git": "folder-git", ".github": "folder-git",
      ".gitlab": "folder-git", ".husky": "folder-git",
      ".idea": "folder-config", ".vscode": "folder-config",
      ".storybook": "folder-config", ".next": "folder-config", ".nuxt": "folder-config",
      "assets": "folder-assets", "resources": "folder-assets",
      "images": "folder-assets", "static": "folder-assets", "public": "folder-assets",
      "packages": "folder-packages", "modules": "folder-packages",
      "node_modules": "folder-packages",
      "dist": "folder-dist", "build": "folder-dist",
      "out": "folder-dist", "target": "folder-dist",
      "examples": "folder-examples", "demos": "folder-examples",
      "docker": "folder-docker", "k8s": "folder-docker",
      "kubernetes": "folder-docker", "charts": "folder-docker",
      "terraform": "folder-config", "infra": "folder-config",
      "src-tauri": "folder-tauri",
      "i18n": "folder-i18n", "locales": "folder-i18n", "translations": "folder-i18n",
      "components": "folder", "pages": "folder", "views": "folder",
      "ui": "folder", "hooks": "folder", "utils": "folder",
      "helpers": "folder", "models": "folder", "api": "folder",
      "routes": "folder", "services": "folder", "middleware": "folder",
      "styles": "folder", "themes": "folder", "types": "folder",
      "prisma": "folder", "migrations": "folder",
    },
    folderNamesExpanded: {
      "src": "folder-src-open", "source": "folder-src-open", "lib": "folder-src-open",
      "app": "folder-src-open", "core": "folder-src-open",
      "test": "folder-test-open", "tests": "folder-test-open",
      "__tests__": "folder-test-open", "spec": "folder-test-open",
      "specs": "folder-test-open", "e2e": "folder-test-open",
      "fixtures": "folder-test-open", "__mocks__": "folder-test-open",
      "docs": "folder-docs-open", "documentation": "folder-docs-open",
      "design": "folder-design-open", "mockups": "folder-design-open",
      "scripts": "folder-scripts-open", "bin": "folder-scripts-open",
      "tools": "folder-scripts-open",
      "config": "folder-config-open", "configs": "folder-config-open",
      ".git": "folder-git-open", ".github": "folder-git-open",
      ".gitlab": "folder-git-open", ".husky": "folder-git-open",
      ".idea": "folder-config-open", ".vscode": "folder-config-open",
      ".storybook": "folder-config-open", ".next": "folder-config-open",
      ".nuxt": "folder-config-open",
      "assets": "folder-assets-open", "resources": "folder-assets-open",
      "images": "folder-assets-open", "static": "folder-assets-open",
      "public": "folder-assets-open",
      "packages": "folder-packages-open", "modules": "folder-packages-open",
      "node_modules": "folder-packages-open",
      "dist": "folder-dist-open", "build": "folder-dist-open",
      "out": "folder-dist-open", "target": "folder-dist-open",
      "examples": "folder-examples-open", "demos": "folder-examples-open",
      "docker": "folder-docker-open", "k8s": "folder-docker-open",
      "kubernetes": "folder-docker-open", "charts": "folder-docker-open",
      "terraform": "folder-config-open", "infra": "folder-config-open",
      "src-tauri": "folder-tauri-open",
      "i18n": "folder-i18n-open", "locales": "folder-i18n-open",
      "translations": "folder-i18n-open",
    },
    defaults: {
      file: "file",
      folder: "folder",
      folderOpen: "folder-open",
    },
    icons: Object.fromEntries(all.map(n => [n, { path: `icons/${n}.svg` }])),
  };
}

// ─── Aurora UI icons (Lucide paths, mono/currentColor) ───────────────────────

const UI_SLOTS: Record<string, string> = {
  explorer:   "folder-tree",
  search:     "search",
  git:        "git-branch",
  run:        "play",
  debug:      "bug",
  test:       "flask-conical",
  extensions: "puzzle",
  terminal:   "terminal",
  problems:   "triangle-alert",
  output:     "scroll-text",
  database:   "database",
  remote:     "globe",
  settings:   "settings",
  containers: "box",
  snippets:   "code-2",
  bookmarks:  "bookmark",
  "ext-logs": "file-text",
};

function makeUiIcons(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(UI_SLOTS).map(([slot, name]) => {
      const src = lucide(name);
      // Rewrite all stroke/fill to currentColor for mono rendering
      const out = src
        .replace(/stroke="[^"]*"/g, 'stroke="currentColor"')
        .replace(/fill="none"/g, 'fill="none"')
        .replace(/class="[^"]*"/g, "")
        .replace(/width="\d+" height="\d+"\s*/g, "")
        .replace(/\n\s*/g, " ")
        .trim();
      return [`${slot}.svg`, out];
    }),
  );
}

function makeUiPackJson(): object {
  return {
    id:   "sindri-aurora-ui",
    name: "Aurora UI Icons",
    kind: "mono",
    fileExtensions: {},
    fileNames: {},
    defaults: { file: "file-default", folder: "file-default", folderOpen: "file-default" },
    icons: {
      "file-default": { path: "icons/explorer.svg" },
      ...Object.fromEntries(
        Object.keys(UI_SLOTS).map(slot => [slot, { path: `icons/${slot}.svg` }]),
      ),
    },
  };
}

// ─── Write extensions ─────────────────────────────────────────────────────────

const repoRoot = new URL("../..", import.meta.url).pathname;

function generate(label: string, outDir: string, icons: Record<string, string>, jsonContent: object, jsonFile = "icons.json"): void {
  const iconsDir = path.join(outDir, "icons");
  fs.mkdirSync(iconsDir, { recursive: true });
  for (const [name, svg] of Object.entries(icons)) {
    fs.writeFileSync(path.join(iconsDir, name), svg + "\n");
  }
  fs.writeFileSync(path.join(outDir, jsonFile), JSON.stringify(jsonContent, null, 2) + "\n");
  console.log(`✓ ${Object.keys(icons).length} icons → ${label}`);
}

generate(
  "aurora-file-icons",
  path.join(repoRoot, "sindri-extensions/aurora-theme-pack/aurora-file-icons"),
  makeFileIcons(),
  makeFileIconsJson(),
);

generate(
  "aurora-ui-icons",
  path.join(repoRoot, "sindri-extensions/aurora-theme-pack/aurora-ui-icons"),
  makeUiIcons(),
  makeUiPackJson(),
  "ui-pack.json",
);
