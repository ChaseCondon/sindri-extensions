<script lang="ts">
  import { onMount } from "svelte";
  import HeatmapGrid from "./HeatmapGrid.svelte";

  interface CommitDay { date: string; count: number; }
  interface RepoInfo { name: string; path: string; commits: CommitDay[]; streak: number; }

  let repos: RepoInfo[] = [];
  let aggregate: { commits: CommitDay[]; streak: number } | null = null;
  let loading = true;
  let error = "";
  let selectedPath = "__all__";

  $: selected = aggregate
    ? selectedPath === "__all__"
      ? aggregate
      : repos.find(r => r.path === selectedPath) ?? aggregate
    : null;

  onMount(() => {
    const api = acquireSindriApi();

    api.onMessage((msg: unknown) => {
      const m = msg as {
        type?: string;
        repos?: RepoInfo[];
        aggregate?: { commits: CommitDay[]; streak: number };
        error?: string;
      };
      if (m?.error) { error = m.error; loading = false; return; }
      if (m?.type === "data" && m.repos && m.aggregate) {
        repos = m.repos;
        aggregate = m.aggregate;
        loading = false;
      }
    });

    api.postMessage({ type: "ready" });
  });
</script>

<main>
  {#if loading && !error}
    <p class="status">Loading commit history…</p>
  {:else if error}
    <p class="status error">{error}</p>
  {:else if aggregate}
    {#if repos.length > 1}
      <div class="repo-bar">
        <select bind:value={selectedPath} class="repo-select">
          <option value="__all__">All repos — 🔥 {aggregate.streak} day streak</option>
          {#each repos as repo}
            <option value={repo.path}>{repo.name} — 🔥 {repo.streak}</option>
          {/each}
        </select>
      </div>
    {/if}
    {#if selected}
      <HeatmapGrid commits={selected.commits} streak={selected.streak} repoCount={repos.length} />
    {/if}
  {/if}
</main>

<style>
  main { display: flex; flex-direction: column; color: var(--sindri-fg, #ccc); }

  .status { opacity: 0.5; font-size: 13px; margin: 16px; }
  .error { color: #f88; opacity: 1; }

  .repo-bar {
    padding: 8px 16px;
    border-bottom: 1px solid var(--sindri-border, #333);
    flex-shrink: 0;
  }

  .repo-select {
    width: 100%;
    background: var(--sindri-bg-panel, #252526);
    color: var(--sindri-fg, #ccc);
    border: 1px solid var(--sindri-border, #444);
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
    font-family: inherit;
    cursor: pointer;
  }
</style>
