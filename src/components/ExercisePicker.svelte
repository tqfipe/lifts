<script lang="ts">
  import Sheet from './Sheet.svelte';
  import ExerciseIcon from './ExerciseIcon.svelte';
  import { app } from '../lib/store.svelte';
  import { sortExercisesForPicker } from '../lib/derive';
  import { commonNotIn } from '../lib/exerciseCatalog';
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

  const common = $derived.by(() => {
    const left = commonNotIn(app.data.exercises);
    const q = normalizeName(query);
    return q ? left.filter((c) => normalizeName(c.name).includes(q)) : left;
  });

  const exactMatch = $derived(
    results.some((e) => normalizeName(e.name) === normalizeName(query)) ||
      common.some((c) => normalizeName(c.name) === normalizeName(query)),
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
      <button class="item create" onclick={() => pick(query)}>
        <span class="icon-tile plus" aria-hidden="true">+</span>
        <span class="item-name">Create “{query.trim()}”</span>
      </button>
    {/if}
    {#if results.length}
      <p class="section display">Your exercises</p>
      {#each results as e (e.id)}
        <button class="item" onclick={() => pick(e.name)}>
          <span class="icon-tile" aria-hidden="true"><ExerciseIcon name={e.name} size={19} /></span>
          <span class="item-name">{e.name}</span>
        </button>
      {/each}
    {/if}
    {#if common.length}
      <p class="section display">Common</p>
      {#each common as c (c.name)}
        <button class="item dim" onclick={() => pick(c.name)}>
          <span class="icon-tile" aria-hidden="true"><ExerciseIcon name={c.name} size={19} /></span>
          <span class="item-name">{c.name}</span>
        </button>
      {/each}
    {/if}
    {#if !results.length && !common.length && !query.trim()}
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
    max-height: 58dvh;
    overflow-y: auto;
    padding-bottom: 4px;
  }
  .section {
    font-size: 0.72rem;
    letter-spacing: 0.13em;
    color: var(--text-dim);
    margin: 10px 2px 2px;
  }
  .item {
    display: flex;
    align-items: center;
    gap: 12px;
    text-align: left;
    padding: 10px 12px;
    background: var(--surface-2);
    border-radius: var(--radius);
    font-weight: 600;
  }
  .item:active {
    background: var(--border);
  }
  .item.dim .item-name {
    color: var(--text-dim);
  }
  .icon-tile {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    border-radius: 11px;
    background: var(--surface);
    border: 1px solid var(--hairline);
    color: var(--accent);
  }
  .icon-tile.plus {
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--on-accent);
    background: var(--grad-accent);
    border: none;
  }
  .item-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
