<script lang="ts">
  import { onMount } from "svelte";

  export let commits: { date: string; count: number }[] = [];
  export let streak = 0;
  export let repoCount = 1;

  let gridEl: HTMLDivElement;
  let cols = 53;

  const accent = "var(--sindri-accent, #0af)";

  function cellBackground(count: number): string {
    if (count === 0) return "var(--sindri-border, #333)";
    const pct = Math.min(100, count * 20 + 15);
    return `color-mix(in srgb, ${accent} ${pct}%, transparent)`;
  }

  onMount(() => {
    const obs = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width ?? 0;
      // Each cell: ~13px + 2px gap = 15px per column; min 13 cols, max 53
      cols = w > 0 ? Math.max(13, Math.min(53, Math.floor(w / 15))) : 53;
    });
    obs.observe(gridEl);
    return () => obs.disconnect();
  });
</script>

<section class="heatmap" bind:this={gridEl}>
  <div class="grid" style="grid-template-columns: repeat({cols}, 1fr)">
    {#each commits as c (c.date)}
      <div
        class="cell"
        style="background:{cellBackground(c.count)}"
        title="{c.date}: {c.count} commit{c.count !== 1 ? 's' : ''}"
      />
    {/each}
  </div>
  <p class="footer">
    🔥 {streak}-day streak{repoCount > 1 ? " (aggregated)" : ""}
  </p>
</section>

<style>
  .heatmap {
    padding: 16px;
    min-width: 0;
    overflow: hidden;
  }

  .grid {
    display: grid;
    gap: 2px;
    width: 100%;
  }

  .cell {
    height: 13px;
    border-radius: 2px;
    cursor: default;
    position: relative;
    min-width: 0;
  }

  .cell:hover::after {
    content: attr(title);
    position: absolute;
    bottom: calc(100% + 4px);
    left: 50%;
    transform: translateX(-50%);
    background: var(--sindri-bg-panel, #252526);
    color: var(--sindri-fg, #ccc);
    border: 1px solid var(--sindri-border, #444);
    border-radius: 4px;
    padding: 2px 7px;
    font-size: 11px;
    white-space: nowrap;
    z-index: 10;
    pointer-events: none;
  }

  .footer {
    margin: 10px 0 0;
    font-size: 12px;
    opacity: 0.7;
  }
</style>
