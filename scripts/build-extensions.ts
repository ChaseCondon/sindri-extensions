/**
 * Build one or all Sindri extensions.
 *
 * This script discovers every directory containing a manifest.json under
 * sindri-extensions/ and delegates each one to sindri-ide/scripts/build-extension.ts.
 * It covers all three index types:
 *
 *   extensions  — standalone leaf extensions (code, webview, data-only)
 *   packs       — pack root manifest + each member extension
 *   collections — collection root + sub-pack roots + each leaf extension
 *
 * Usage (from sindri-extensions/):
 *   bun run build                        # build everything + produce .sinxt
 *   bun run build-ext <path>             # build one, no .sinxt
 *   bun run build-ext <path> --bundle    # build one + produce .sinxt
 *
 *   <path> is relative to sindri-extensions/, e.g.:
 *     sindri-csv-grid
 *     aurora-theme-pack/aurora-file-icons
 *     community-theme-collection/sindri-dracula/sindri-dracula-color
 */

import * as path from "path";
import * as fs from "fs";

const here = new URL(".", import.meta.url).pathname;                           // sindri-extensions/scripts/
const extRoot = path.resolve(here, "..");                                       // sindri-extensions/
const ideRoot = process.env.SINDRI_IDE_ROOT ?? path.resolve(here, "../../sindri-ide"); // sindri-ide/
const buildScript = path.join(ideRoot, "scripts/build-extension.ts");

const args = process.argv.slice(2);
const buildAll = args.includes("--all");
const bundle = args.includes("--bundle");
const target = args.find((a) => !a.startsWith("--"));

if (!buildAll && !target) {
  console.log("Usage:");
  console.log("  bun run scripts/build-extensions.ts --all [--bundle]  # build everything");
  console.log("  bun run scripts/build-extensions.ts <path> [--bundle] # build one");
  console.log("");
  console.log("  <path> is relative to sindri-extensions/, e.g.:");
  console.log("    sindri-csv-grid");
  console.log("    aurora-theme-pack/aurora-file-icons");
  console.log("    community-theme-collection/sindri-dracula/sindri-dracula-color");
  process.exit(0);
}

/** Recursively find all directories containing a manifest.json. */
function findManifestDirs(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === "node_modules") continue;
    const child = path.join(dir, entry.name);
    if (fs.existsSync(path.join(child, "manifest.json"))) {
      results.push(child);
    }
    results.push(...findManifestDirs(child));
  }
  return results.sort();
}

function buildOne(absExtDir: string, withBundle: boolean): boolean {
  const extraArgs = withBundle ? ["--bundle"] : [];
  const result = Bun.spawnSync(
    ["bun", "run", buildScript, absExtDir, ...extraArgs],
    { cwd: ideRoot, stdout: "inherit", stderr: "inherit" },
  );
  return result.exitCode === 0;
}

let targets: string[];
if (buildAll) {
  targets = findManifestDirs(extRoot);
} else {
  const abs = path.resolve(extRoot, target!);
  if (!fs.existsSync(path.join(abs, "manifest.json"))) {
    console.error(`✘ No manifest.json found at: ${abs}`);
    process.exit(1);
  }
  targets = [abs];
}

let failed = 0;
for (const dir of targets) {
  const label = path.relative(extRoot, dir);
  console.log(`\n── ${label} ──`);
  if (!buildOne(dir, bundle)) {
    console.error(`✘ ${label}`);
    failed++;
  }
}

if (buildAll) {
  const ok = targets.length - failed;
  console.log(
    `\n${ok}/${targets.length} extensions built${bundle ? " and bundled" : ""}.`,
  );
}

if (failed > 0) process.exit(1);
