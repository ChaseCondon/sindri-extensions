import { computeStreak } from "./streak";
import { createWebviewHtml } from "@sindri/api/helpers";

async function fetchCommitData(): Promise<{
  commits: { date: string; count: number }[];
  streak: number;
}> {
  const { stdout, stderr } = await sindri.env.exec(
    "git", "log", "--format=%cd", "--date=short", "-n", "365",
  );
  if (stderr) console.warn("[commit-streak] git stderr:", stderr);

  const dates = stdout.split("\n").filter(Boolean);
  const streak = computeStreak(dates);

  const counts = new Map<string, number>();
  for (const d of dates) counts.set(d, (counts.get(d) ?? 0) + 1);

  const commits = Array.from({ length: 365 }, (_, i) => {
    const dt = new Date();
    dt.setDate(dt.getDate() - (364 - i));
    const key = dt.toISOString().slice(0, 10);
    return { date: key, count: counts.get(key) ?? 0 };
  });

  return { commits, streak };
}

export async function activate(context: ExtensionContext): Promise<void> {
  const chip = sindri.ui.createStatusBarItem("sindri.commit-streak.chip", {
    text: "🔥 …",
    tooltip: "Commit streak — loading",
  });
  chip.show();

  let panel: WebviewPanel | undefined;

  const provider: WebviewPanelProvider = {
    getHtml(_ctx: WebviewContext): string {
      return createWebviewHtml("sindri.commit-streak");
    },

    async onMessage(msg: unknown): Promise<void> {
      if ((msg as { type?: string })?.type !== "ready") return;
      try {
        const data = await fetchCommitData();
        panel?.postMessage(data);
      } catch (err) {
        console.error("[commit-streak] failed to load data:", String(err));
        panel?.postMessage({ error: String(err) });
      }
    },
  };

  panel = sindri.ui.registerWebviewPanel(
    {
      id: "sindri.commit-streak",
      title: "Commit Streak",
      defaultDock: "right-bottom",
    },
    provider,
  );

  context.subscriptions.push(chip, panel);

  // Populate the chip on startup
  try {
    const { streak } = await fetchCommitData();
    chip.text = `🔥 ${streak}`;
    chip.tooltip = `${streak}-day commit streak`;
  } catch {
    chip.text = "🔥 —";
    chip.tooltip = "Commit streak — git not available";
  }
}

export function deactivate(): void {}
