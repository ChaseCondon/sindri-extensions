/**
 * build-index.ts — Generates index.json from individual extension manifests.
 *
 * Usage: bun run scripts/build-index.ts
 * (or via package.json: bun run build-index)
 *
 * Never edit index.json by hand — run this script instead.
 *
 * Classification rules:
 *   collections — Extension Pack with `packKind: "theme"` (large community bundles)
 *   packs       — Extension Pack without packKind (small cohesive bundles, e.g. aurora)
 *   extensions  — everything else that is NOT a member of any extensionPack list
 *
 * Sub-members of packs/collections are NOT listed separately in extensions; the IDE
 * discovers them by following `extensionPack` at install time.
 * Exception: extensions with category "Icon Theme Base" are always listed in extensions
 * even when nested inside a collection folder — they are independently installable.
 */

import * as path from "path";
import * as fs from "fs";

const repoRoot = new URL("..", import.meta.url).pathname;
const SKIP = new Set(["node_modules", "dist", "scripts", ".git"]);

// ─── Discover all manifest.json files ────────────────────────────────────────

interface ManifestEntry {
  absPath:  string;  // absolute path to the manifest.json
  relDir:   string;  // path to the extension folder, relative to repoRoot
  manifest: Record<string, unknown>;
}

function findManifests(dir: string, skip: Set<string>): ManifestEntry[] {
  const results: ManifestEntry[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findManifests(full, skip));
    } else if (entry.name === "manifest.json") {
      const manifest = JSON.parse(fs.readFileSync(full, "utf8"));
      results.push({
        absPath:  full,
        relDir:   path.relative(repoRoot, path.dirname(full)),
        manifest,
      });
    }
  }
  return results;
}

const all = findManifests(repoRoot, SKIP);

// ─── Build member-ID set (extensions referenced in any extensionPack) ─────────

const packMemberIds = new Set<string>();
for (const { manifest } of all) {
  const pack = manifest.extensionPack as string[] | undefined;
  if (Array.isArray(pack)) {
    for (const id of pack) packMemberIds.add(id);
  }
}

// ─── Classify ─────────────────────────────────────────────────────────────────

interface IndexEntry { id: string; path: string; memberPaths?: string[]; }

const extensions: IndexEntry[] = [];
const packs: IndexEntry[]      = [];
const collections: IndexEntry[] = [];

for (const { manifest, relDir } of all) {
  const id         = manifest.id as string;
  const categories = manifest.categories as string[] | undefined ?? [];
  const packKind   = manifest.packKind as string | undefined;
  const isPack     = categories.includes("Extension Pack");
  const isBase     = categories.includes("Icon Theme Base");
  const isMember   = packMemberIds.has(id);

  const packMembers = manifest.extensionPack as string[] | undefined;
  // Resolve memberPaths: find folder paths for each member ID listed in extensionPack.
  const memberPaths = packMembers?.length
    ? all
        .filter(({ manifest: m }) => packMembers.includes(m.id as string))
        .map(({ relDir: r }) => r)
    : undefined;

  if (isPack && !isMember && packKind === "theme") {
    collections.push({ id, path: relDir, ...(memberPaths ? { memberPaths } : {}) });
  } else if (isPack && !isMember) {
    packs.push({ id, path: relDir, ...(memberPaths ? { memberPaths } : {}) });
  } else if (!isMember || isBase) {
    // Standalone extension, or Icon Theme Base that should always be listed
    extensions.push({ id, path: relDir });
  }
}

// Sort each list by id for deterministic output
const byId = (a: IndexEntry, b: IndexEntry) => a.id.localeCompare(b.id);
extensions.sort(byId);
packs.sort(byId);
collections.sort(byId);

// ─── Write output ─────────────────────────────────────────────────────────────
// Index is a flat list of folder paths per category — no IDs or memberPaths.
// The runtime enriches by fetching each manifest.json; packs/collections are
// walked recursively by the registry client using manifest extensionPack fields.

const index = {
  name:        "Sindri Sample Extensions",
  description: "Official sample extensions for Sindri IDE — one per API surface, for extension developers.",
  homepage:    "https://github.com/sindri-ide/sindri-extensions",
  extensions:  extensions.map(e => e.path),
  packs:       packs.map(p => p.path),
  collections: collections.map(c => c.path),
};

const outPath = path.join(repoRoot, "index.json");
fs.writeFileSync(outPath, JSON.stringify(index, null, 2) + "\n");

console.log(`✓ index.json — ${extensions.length} extensions, ${packs.length} packs, ${collections.length} collections`);
for (const e of extensions)  console.log(`  ext  ${e.id}`);
for (const p of packs)       console.log(`  pack ${p.id}`);
for (const c of collections) console.log(`  coll ${c.id}`);
