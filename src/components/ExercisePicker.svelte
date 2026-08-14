<script lang="ts">
  import Sheet from './Sheet.svelte';
  import { app } from '../lib/store.svelte';
  import { sortExercisesForPicker } from '../lib/derive';
  import { normalizeName } from '../lib/normalize';

  let {
    open = $bindable(false),
    exclude = [],
    onpick,
  }: { open?: boolean; exclude?: string[]; onpick: (name: string) => void } = $props();

  let query = $state('');

  $effect(() => {
    if (open) query = '';
  });

  const results = $derived.by(() => {
    const sorted = sortExercisesForPicker(app.data.exercises, app.data.workouts).filter(
      (e) => !exclude.includes(e.id),
    );
    const q = normalizeName(query);
    return q ? sorted.filter((e) => normalizeName(e.name).includes(q)) : sorted;
  });

  const exactMatch = $derived(
    results.some((e) => normalizeName(e.name) === normalizeName(query)),
  );

  function pick(name: string): void {
    onpick(name);
    open = false;
  }
</script>

<Sheet bind:open>
  <input class="search" placeholder="Search or type a new exercise…" bind:value={query} />
  <div class="list">
    {#if query.trim() && !exactMatch}
      <button class="item create" onclick={() => pick(query)}>+ Create “{query.trim()}”</button>
    {/if}
    {#each results as e (e.id)}
      <button class="item" onclick={() => pick(e.name)}>{e.name}</button>
    {/each}
    {#if !results.length && !query.trim()}
      <p class="empty">Type a name to add your first exercise.</p>
    {/if}
  </div>
</Sheet>

<style>
  .list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-height: 30dvh;
  }
  .item {
    text-align: left;
    padding: 13px 14px;
    background: var(--surface-2);
    border-radius: var(--radius);
    font-weight: 600;
  }
  .item:active {
    background: var(--border);
  }
  .create {
    color: var(--accent);
  }
  .empty {
    color: var(--text-dim);
    text-align: center;
    padding: 24px 0;
  }
</style>
