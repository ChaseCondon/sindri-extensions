import { computeStreak } from "./streak";
import { createWebviewHtml } from "@sindri/api/helpers";

interface CommitDay { date: string; count: number; }
interface RepoInfo { name: string; path: string; commits: CommitDay[]; streak: number; }

function buildCommitDays(dates: string[]): CommitDay[] {
  const counts = new Map<string, number>();
  for (const d of dates) counts.set(d, (counts.get(d) ?? 0) + 1);
  return Array.from({ length: 365 }, (_, i) => {
    const dt = new Date();
    dt.setDate(dt.getDate() - (364 - i));
    const key = dt.toISOString().slice(0, 10);
    return { date: key, count: counts.get(key) ?? 0 };
  });
}

async function gitLog(repoPath: string): Promise<string[]> {
  try {
    const { stdout, stderr, code } = await sindri.env.exec(
      "git", "-C", repoPath, "log", "--format=%cd", "--date=short", "-n", "365",
    );
    if (stderr) console.warn(`[commit-streak] git -C ${repoPath} stderr (exit ${code}):`, stderr.trim());
    if (code !== 0) { console.warn(`[commit-streak] git log failed for ${repoPath}, exit ${code}`); return []; }
    const dates = stdout.split("\n").filter(Boolean);
    console.log(`[commit-streak] git log ${repoPath}: ${dates.length} entries, first=${dates[0] ?? "(none)"}`);
    return dates;
  } catch (err) {
    console.warn(`[commit-streak] git exec threw for ${repoPath}:`, String(err));
    return [];
  }
}

async function findRepos(workspaceRoot: string): Promise<{ name: string; path: string }[]> {
  // Try `find` to locate .git dirs; fall back through known absolute paths for macOS app sandbox.
  for (const findCmd of ["find", "/usr/bin/find"]) {
    try {
      const { stdout, stderr, code } = await sindri.env.exec(
        findCmd, workspaceRoot, "-maxdepth", "3", "-name", ".git", "-type", "d",
      );
      if (stderr) console.warn(`[commit-streak] ${findCmd} stderr (exit ${code}):`, stderr.trim());
      if (code !== 0) continue;
      const repos = stdout.split("\n")
        .filter(line => /\/\.git$/.test(line.trim()))
        .map(gitDir => {
          const p = gitDir.trim().replace(/\/.git$/, "");
          return { name: p.split("/").pop() ?? p, path: p };
        });
      console.log(`[commit-streak] found ${repos.length} repos under ${workspaceRoot}:`, repos.map(r => r.name).join(", ") || "(none)");
      if (repos.length > 0) return repos;
      // find ran but found nothing; workspaceRoot might itself be a repo
      break;
    } catch (err) {
      console.warn(`[commit-streak] ${findCmd} exec threw:`, String(err));
    }
  }
  // Fallback: check if workspaceRoot is itself a git repo
  console.warn("[commit-streak] falling back to workspace root as single repo");
  return [{ name: workspaceRoot.split(/[\\/]/).pop() ?? "workspace", path: workspaceRoot }];
}

async function fetchAllData(workspaceRoot: string): Promise<{
  repos: RepoInfo[];
  aggregate: { commits: CommitDay[]; streak: number };
}> {
  const repos = await findRepos(workspaceRoot);
  if (repos.length === 0) {
    return { repos: [], aggregate: { commits: buildCommitDays([]), streak: 0 } };
  }

  const repoInfos = await Promise.all(repos.map(async ({ name, path }) => {
    try {
      const dates = await gitLog(path);
      return { name, path, commits: buildCommitDays(dates), streak: computeStreak(dates) };
    } catch {
      return { name, path, commits: buildCommitDays([]), streak: 0 };
    }
  }));

  // Aggregate: union of all commit dates across repos (each date counted once per repo)
  const aggCounts = new Map<string, number>();
  for (const repo of repoInfos) {
    for (const { date, count } of repo.commits) {
      if (count > 0) aggCounts.set(date, (aggCounts.get(date) ?? 0) + count);
    }
  }
  const aggDates = Array.from(aggCounts.keys());
  const aggCommits = Array.from({ length: 365 }, (_, i) => {
    const dt = new Date();
    dt.setDate(dt.getDate() - (364 - i));
    const key = dt.toISOString().slice(0, 10);
    return { date: key, count: aggCounts.get(key) ?? 0 };
  });

  return {
    repos: repoInfos,
    aggregate: { commits: aggCommits, streak: computeStreak(aggDates) },
  };
}

export async function activate(context: ExtensionContext): Promise<void> {
  const chip = sindri.ui.createStatusBarItem("sindri.commit-streak.chip", {
    text: "🔥 …",
    tooltip: "Commit streak — loading",
  });
  chip.show();

  let panel: WebviewPanel | undefined;

  panel = sindri.ui.registerWebviewPanel(
    { id: "sindri.commit-streak", title: "Commit Streak", defaultDock: "right-bottom" },
    {
      getHtml(_ctx: WebviewContext): string {
        return createWebviewHtml("sindri.commit-streak", { css: false });
      },
      async onMessage(msg: unknown): Promise<void> {
        if ((msg as { type?: string })?.type !== "ready") return;
        // Read workspaceRoot dynamically — it may have been null at activation time.
        const root = sindri.env.workspaceRoot;
        console.log("[commit-streak] panel ready, workspaceRoot =", root);
        if (!root) {
          panel?.postMessage({ error: "No workspace folder open." });
          return;
        }
        try {
          const data = await fetchAllData(root);
          panel?.postMessage({ type: "data", ...data });
        } catch (err) {
          console.warn("[commit-streak] fetchAllData threw:", String(err));
          panel?.postMessage({ error: String(err) });
        }
      },
    },
  );

  context.subscriptions.push(chip, panel);

  // Read dynamically so workspace-open-after-activation works correctly.
  const root = sindri.env.workspaceRoot;
  console.log("[commit-streak] activate, workspaceRoot =", root);
  if (root) {
    try {
      const { aggregate } = await fetchAllData(root);
      chip.text = `🔥 ${aggregate.streak}`;
      chip.tooltip = `${aggregate.streak}-day streak across all repos`;
    } catch (err) {
      console.warn("[commit-streak] initial fetchAllData failed:", String(err));
      chip.text = "🔥 —";
      chip.tooltip = "Commit streak — git not available";
    }
  } else {
    chip.text = "🔥 —";
    chip.tooltip = "Commit streak — open a workspace folder";
  }
}

export function deactivate(): void {}
