/**
 * Create GitHub Releases for extensions whose version was bumped.
 *
 * Run by the Changesets action as the `publish` step after the Version PR is merged.
 * For each top-level extension whose current version doesn't yet have a GitHub Release,
 * this script:
 *   1. Builds the .sinxt bundle (delegates to sindri-ide/scripts/build-extension.ts)
 *   2. Creates a GitHub Release tagged `{id}-v{version}` with the .sinxt as the asset
 *
 * Requires: gh CLI authenticated, bun on PATH, sindri-ide cloned as a sibling directory.
 */

import { spawnSync } from "child_process";
import { readdirSync, readFileSync, existsSync } from "fs";
import { join, resolve } from "path";

const extRoot = resolve(import.meta.dir, "..");
const ideRoot = process.env.SINDRI_IDE_ROOT ?? resolve(extRoot, "../sindri-ide");

interface Manifest { id: string; version: string; name: string; }

function readManifest(dir: string): Manifest | null {
  const p = join(dir, "manifest.json");
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf-8")) as Manifest;
}

function run(cmd: string, args: string[], opts: { cwd?: string } = {}): boolean {
  const result = spawnSync(cmd, args, { cwd: opts.cwd ?? extRoot, stdio: "inherit" });
  return result.status === 0;
}

function releaseExists(tag: string): boolean {
  const r = spawnSync("gh", ["release", "view", tag], { encoding: "utf-8", stdio: "pipe" });
  return r.status === 0;
}

function buildSinxt(dir: string): boolean {
  if (!existsSync(ideRoot)) {
    console.error(`sindri-ide not found at: ${ideRoot}`);
    console.error("CI must check out sindri-ide as a sibling of sindri-extensions.");
    return false;
  }
  return run("bun", ["run", join(ideRoot, "scripts/build-extension.ts"), dir, "--bundle"], { cwd: ideRoot });
}

function createRelease(dir: string, manifest: Manifest): boolean {
  const { id, version, name } = manifest;
  const tag = `${id}-v${version}`;
  const sinxtPath = join(dir, `dist/${id}-${version}.sinxt`);

  if (!existsSync(sinxtPath)) {
    console.error(`Expected .sinxt not found: ${sinxtPath}`);
    return false;
  }

  const isPrerelease = version.includes("-");
  const args = [
    "release", "create", tag,
    "--title", `${name ?? id} v${version}`,
    "--notes", `Release of \`${id}\` v${version}.\n\nSee [CHANGELOG.md](./CHANGELOG.md) for details.`,
    sinxtPath,
  ];
  if (isPrerelease) args.splice(3, 0, "--prerelease");

  return run("gh", args);
}

// --- Main ---

const extensions = readdirSync(extRoot, { withFileTypes: true })
  .filter(e => e.isDirectory() && !e.name.startsWith(".") && e.name !== "node_modules")
  .map(e => ({ dir: join(extRoot, e.name), manifest: readManifest(join(extRoot, e.name)) }))
  .filter((x): x is { dir: string; manifest: Manifest } => x.manifest !== null);

let released = 0;
let failed = 0;

for (const { dir, manifest } of extensions) {
  const { id, version } = manifest;
  const tag = `${id}-v${version}`;

  if (releaseExists(tag)) {
    console.log(`✓ ${id}@${version} already released`);
    continue;
  }

  console.log(`\n── Releasing ${id}@${version} ──`);

  if (!buildSinxt(dir)) {
    console.error(`✘ Build failed: ${id}`);
    failed++;
    continue;
  }

  if (!createRelease(dir, manifest)) {
    console.error(`✘ Release failed: ${id}`);
    failed++;
    continue;
  }

  console.log(`✓ Released ${tag}`);
  released++;
}

console.log(`\n${released} released, ${failed} failed.`);
if (failed > 0) process.exit(1);
