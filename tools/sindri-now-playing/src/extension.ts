/**
 * sindri-now-playing — smoke test for exec + createStatusBarItem.
 *
 * Reads the current playerctl track on activation and exposes a refresh command.
 * If playerctl isn't running or no player is active, the item shows "♪ —".
 */

async function fetchNowPlaying(): Promise<string> {
  try {
    const result = await sindri.env.exec(
      "playerctl",
      "metadata",
      "--format",
      "♪ {{artist}} - {{title}}",
    );
    if (result.code !== 0 || !result.stdout.trim()) return "♪ —";
    return result.stdout.trim();
  } catch {
    return "♪ —";
  }
}

export async function activate(context: ExtensionContext): Promise<void> {
  const item = sindri.ui.createStatusBarItem("sindri.now-playing", { text: "♪ …", tooltip: "Now Playing" });
  item.show();

  async function refresh(): Promise<void> {
    item.text = await fetchNowPlaying();
  }

  context.subscriptions.push(
    sindri.commands.register("now-playing.refresh", refresh) as unknown as { dispose(): void },
    item,
  );

  await refresh();
}

export function deactivate(): void {}
