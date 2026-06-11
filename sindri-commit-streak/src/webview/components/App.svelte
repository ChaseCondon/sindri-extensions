<script lang="ts">
  import { onMount } from "svelte";
  import HeatmapGrid from "./HeatmapGrid.svelte";

  interface CommitDay {
    date: string;
    count: number;
  }

  let commits: CommitDay[] = [];
  let streak = 0;
  let loading = true;
  let error = "";

  onMount(() => {
    const api = acquireSindriApi();

    api.onMessage((data: unknown) => {
      const msg = data as { commits?: CommitDay[]; streak?: number; error?: string };
      if (msg?.error) {
        error = msg.error;
        loading = false;
        return;
      }
      if (msg?.commits) {
        commits = msg.commits;
        streak = msg.streak ?? 0;
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
    <p class="status error">Could not load commit data — is git available?</p>
  {:else}
    <HeatmapGrid {commits} {streak} />
  {/if}
</main>

<style>
  main {
    /* parent padding comes from global body styles */
  }

  .status {
    opacity: 0.5;
    font-size: 13px;
    margin: 0;
  }

  .error {
    color: #f88;
    opacity: 1;
  }
</style>
