/**
 * Sync manifest.json versions from package.json after `changeset version` runs.
 *
 * Changesets owns the version in package.json. This script propagates it to
 * manifest.json (the Sindri extension metadata file). It also cascades the
 * version down into nested sub-extensions (aurora-theme-pack members,
 * community-theme-collection members, etc.) so pack members stay in lockstep
 * with their parent.
 *
 * Run automatically as part of `bun run version`.
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join, resolve } from "path";

const extRoot = resolve(import.meta.dir, "..");

function readJson(p: string): Record<string, unknown> {
  return JSON.parse(readFileSync(p, "utf-8")) as Record<string, unknown>;
}

function writeJson(p: string, obj: Record<string, unknown>): void {
  writeFileSync(p, JSON.stringify(obj, null, 2) + "\n");
}

function syncManifest(dir: string, version: string): boolean {
  const manifestPath = join(dir, "manifest.json");
  if (!existsSync(manifestPath)) return false;
  const manifest = readJson(manifestPath);
  if (manifest.version === version) return false;
  manifest.version = version;
  writeJson(manifestPath, manifest);
  return true;
}

// Cascade version into all nested manifest.json files (sub-extensions of a pack/collection).
function cascadeToSubfolders(packDir: string, version: string): void {
  for (const entry of readdirSync(packDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === "node_modules") continue;
    const subDir = join(packDir, entry.name);
    const changed = syncManifest(subDir, version);
    if (changed) console.log(`  ↳ ${entry.name}/manifest.json → ${version}`);
    cascadeToSubfolders(subDir, version);
  }
}

for (const entry of readdirSync(extRoot, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name === "node_modules" || entry.name.startsWith(".")) continue;

  const dir = join(extRoot, entry.name);
  const pkgPath = join(dir, "package.json");
  const manifestPath = join(dir, "manifest.json");

  if (!existsSync(pkgPath) || !existsSync(manifestPath)) continue;

  const pkg = readJson(pkgPath);
  const version = pkg.version as string | undefined;
  if (!version) continue;

  const changed = syncManifest(dir, version);
  if (changed) {
    console.log(`${entry.name}/manifest.json → ${version}`);
    cascadeToSubfolders(dir, version);
  }
}

console.log("sync-versions: done");
