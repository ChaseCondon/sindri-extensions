/**
 * generate-sindri-icons.ts — Generates sindri-file-icons and sindri-ui-icons.
 * Outputs directly to sindri-ide/core-extensions/ so sindri-ide stays clean
 * of icon library dev deps.
 *
 * Folder + system icons: Phosphor paths (256×256, scaled 0.09375 to 24×24).
 *   Closed folders: Phosphor fill weight — solid, weighted feel.
 *   Open folders:   Phosphor regular weight — same geometry, lighter stroke.
 * Language + tool icons: canonical simple-icons brand paths.
 * Palette: Sindri — indigo/blue, with semantic accent colors.
 *
 * Usage (from sindri-extensions/):
 *   bun run scripts/generate-sindri-icons.ts
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

// ─── Sindri palette ───────────────────────────────────────────────────────────

const S = {
  src:      "#2563eb",  // indigo — default folder / src
  test:     "#dc2626",  // red
  docs:     "#d97706",  // amber
  scripts:  "#16a34a",  // green
  config:   "#0891b2",  // cyan
  assets:   "#ca8a04",  // yellow
  packages: "#0d9488",  // teal
  dist:     "#6b7280",  // grey
  design:   "#9333ea",  // purple
  examples: "#16a34a",  // green (same as scripts)
  git:      "#d97706",  // amber (same as docs)
  docker:   "#0891b2",  // cyan (same as config)
  tauri:    "#24C8D8",  // Tauri brand cyan
  i18n:     "#2563eb",  // indigo (same as src)
  // System icon tints
  blue:     "#3b82f6",
  green:    "#22c55e",
  orange:   "#f59e0b",
  red:      "#ef4444",
  muted:    "#9ca3af",
};

// ─── Brand color overrides (simple-icons canonical color adjustments) ─────────

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

// ─── Phosphor helpers (256×256 → 24×24 via scale) ────────────────────────────

const PHOSPHOR_FILL    = (name: string) => path.join(import.meta.dir, `../node_modules/@phosphor-icons/core/assets/fill/${name}.svg`);
const PHOSPHOR_REGULAR = (name: string) => path.join(import.meta.dir, `../node_modules/@phosphor-icons/core/assets/regular/${name}.svg`);

function phosphorPaths(filePath: string): string {
  const src = fs.readFileSync(filePath, "utf8");
  return [...src.matchAll(/<path\s[^/]*\/>/g)].map(m => m[0]).join("");
}

// Phosphor SVG root carries fill="currentColor"; color is inherited by child paths.
// We replicate that by setting fill on the <g> wrapper instead.
function phosphorFill(name: string, color: string): string {
  const paths = phosphorPaths(PHOSPHOR_FILL(`${name}-fill`));
  return svg24(`<g transform="scale(0.09375)" fill="${color}">${paths}</g>`);
}

function phosphorRegular(name: string, color: string): string {
  const paths = phosphorPaths(PHOSPHOR_REGULAR(name));
  return svg24(`<g transform="scale(0.09375)" fill="${color}">${paths}</g>`);
}

/** Mono version — keeps fill="currentColor" for UI icon theme (slot-based). */
function phosphorRegularMono(name: string): string {
  const paths = phosphorPaths(PHOSPHOR_REGULAR(name));
  return svg24(`<g transform="scale(0.09375)" fill="currentColor">${paths}</g>`);
}

// ─── Folder icons (fill closed, regular open) ─────────────────────────────────

function folderClosed(color: string): string {
  return phosphorFill("folder", color);
}
function folderOpen(color: string): string {
  return phosphorRegular("folder-open", color);
}

// ─── System icons (Phosphor regular, semantic colors) ────────────────────────

function ph(name: string, color: string): string {
  return phosphorRegular(name, color);
}

// ─── Generic file icon ────────────────────────────────────────────────────────

function fileIcon(): string {
  return phosphorRegular("file", "#6b7280");
}

// ─── All file icons ────────────────────────────────────────────────────────────

function makeFileIcons(): Record<string, string> {
  return {
    // Folders — filled/closed, outlined/open
    "folder.svg":              folderClosed(S.src),
    "folder-open.svg":         folderOpen(S.src),
    "folder-src.svg":          folderClosed(S.src),
    "folder-test.svg":         folderClosed(S.test),
    "folder-docs.svg":         folderClosed(S.docs),
    "folder-scripts.svg":      folderClosed(S.scripts),
    "folder-config.svg":       folderClosed(S.config),
    "folder-assets.svg":       folderClosed(S.assets),
    "folder-packages.svg":     folderClosed(S.packages),
    "folder-dist.svg":         folderClosed(S.dist),
    "folder-design.svg":       folderClosed(S.design),
    "folder-examples.svg":     folderClosed(S.examples),
    "folder-git.svg":          folderClosed(S.git),
    "folder-docker.svg":       folderClosed(S.docker),
    "folder-tauri.svg":        folderClosed(S.tauri),
    "folder-i18n.svg":         folderClosed(S.i18n),
    "folder-src-open.svg":     folderOpen(S.src),
    "folder-test-open.svg":    folderOpen(S.test),
    "folder-docs-open.svg":    folderOpen(S.docs),
    "folder-scripts-open.svg": folderOpen(S.scripts),
    "folder-config-open.svg":  folderOpen(S.config),
    "folder-assets-open.svg":  folderOpen(S.assets),
    "folder-packages-open.svg":folderOpen(S.packages),
    "folder-dist-open.svg":    folderOpen(S.dist),
    "folder-design-open.svg":  folderOpen(S.design),
    "folder-examples-open.svg":folderOpen(S.examples),
    "folder-git-open.svg":     folderOpen(S.git),
    "folder-docker-open.svg":  folderOpen(S.docker),
    "folder-tauri-open.svg":   folderOpen(S.tauri),
    "folder-i18n-open.svg":    folderOpen(S.i18n),

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

    // ── System icons (Phosphor regular, sindri palette) ───────────────────
    "git.svg":    ph("git-branch",       S.orange),
    "docker.svg": ph("cube",             S.blue),
    "config.svg": ph("gear",             S.blue),
    "lock.svg":   ph("lock",             S.red),
    "pkg.svg":    ph("package",          S.green),
    "sh.svg":     ph("terminal",         S.green),
    "env.svg":    ph("key",              S.green),
    "json.svg":   ph("brackets-curly",   S.green),
    "yaml.svg":   ph("list",             S.green),
    "toml.svg":   ph("list-bullets",     S.orange),
    "xml.svg":    ph("code",             S.orange),
    "svg.svg":    ph("shapes",           S.blue),
    "txt.svg":    ph("file-text",        S.muted),
    "img.svg":    ph("image",            S.blue),
    "sql.svg":    ph("database",         S.blue),
    "md.svg":     ph("book-open",        S.orange),
    "test.svg":   ph("test-tube",        S.red),
    "license.svg":ph("certificate",      S.orange),
    "ci.svg":     ph("arrows-clockwise", S.green),
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
    id:   "sindri-file-icons",
    name: "Sindri File Icons",
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

// ─── Sindri UI icons (Phosphor regular, mono/currentColor) ───────────────────

const UI_SLOTS: Record<string, string> = {
  explorer:   "files",
  search:     "magnifying-glass",
  git:        "git-branch",
  run:        "play",
  debug:      "bug",
  test:       "test-tube",
  extensions: "plug",
  terminal:   "terminal",
  problems:   "warning-circle",
  output:     "list-bullets",
  database:   "database",
  remote:     "globe-simple",
  settings:   "gear",
  containers: "cube",
  snippets:   "brackets-curly",
  bookmarks:  "bookmarks",
  "ext-logs": "newspaper",
};

function makeUiIcons(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(UI_SLOTS).map(([slot, name]) => {
      return [`${slot}.svg`, phosphorRegularMono(name)];
    }),
  );
}

function makeUiPackJson(): object {
  return {
    id:   "sindri-ui-icons",
    name: "Sindri UI Icons",
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

// Generator lives in sindri-extensions/scripts/ but outputs to sindri-ide/
// ../../ from scripts/ → sindri-extensions/ → sindri/
const sindriIde = new URL("../../sindri-ide/core-extensions", import.meta.url).pathname;

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
  "sindri-file-icons",
  path.join(sindriIde, "sindri-file-icons"),
  makeFileIcons(),
  makeFileIconsJson(),
);

generate(
  "sindri-ui-icons",
  path.join(sindriIde, "sindri-ui-icons"),
  makeUiIcons(),
  makeUiPackJson(),
  "ui-pack.json",
);
