<script lang="ts">
  export let commits: { date: string; count: number }[] = [];
  export let streak = 0;

  // Pick up accent from the injected theme vars
  $: accent = "var(--sindri-accent, #0af)";

  function cellBackground(count: number): string {
    if (count === 0) return "var(--sindri-border, #333)";
    const pct = Math.min(100, count * 20 + 15);
    return `color-mix(in srgb, ${accent} ${pct}%, transparent)`;
  }
</script>

<section class="heatmap">
  <h3 class="title">Commit activity — last 52 weeks</h3>
  <div class="grid">
    {#each commits as c (c.date)}
      <div
        class="cell"
        style="background:{cellBackground(c.count)}"
        title="{c.date}: {c.count} commit{c.count !== 1 ? 's' : ''}"
      />
    {/each}
  </div>
  <p class="footer">{streak}-day streak</p>
</section>

<style>
  .heatmap {
    /* intentionally unstyled — inherits body vars from global styles.scss */
  }

  .title {
    margin: 0 0 12px;
    font-size: 11px;
    font-weight: 600;
    opacity: 0.55;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(53, 1fr);
    gap: 2px;
  }

  .cell {
    aspect-ratio: 1;
    border-radius: 2px;
    cursor: default;
    position: relative;
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
