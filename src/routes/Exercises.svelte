<script lang="ts">
  import ExerciseIcon from '../components/ExerciseIcon.svelte';
  import Sheet from '../components/Sheet.svelte';
  import { GLYPHS, iconForName, type IconId } from '../lib/exerciseCatalog';
  import { sortExercisesForPicker } from '../lib/derive';
  import {
    app,
    deleteExercise,
    exerciseUsageCount,
    renameExercise,
    setExerciseIcon,
  } from '../lib/store.svelte';
  import { toast } from '../lib/toast.svelte';

  const ICON_IDS = Object.keys(GLYPHS) as IconId[];

  const sorted = $derived(sortExercisesForPicker(app.data.exercises, app.data.workouts));

  let editOpen = $state(false);
  let editId = $state<string | null>(null);
  let nameDraft = $state('');
  let nameError = $state(false);
  let deleteArmed = $state(false);

  const editing = $derived(app.data.exercises.find((e) => e.id === editId) ?? null);
  const usage = $derived(editId ? exerciseUsageCount(editId) : 0);

  function openEdit(id: string): void {
    editId = id;
    nameDraft = app.data.exercises.find((e) => e.id === id)?.name ?? '';
    nameError = false;
    deleteArmed = false;
    editOpen = true;
  }

  function commitName(): void {
    if (!editId || !editing || nameDraft.trim() === editing.name) return;
    const ok = renameExercise(editId, nameDraft);
    nameError = !ok;
    if (ok) nameDraft = editing.name;
    else {
      setTimeout(() => (nameError = false), 1600);
    }
  }

  function pickIcon(icon: IconId): void {
    if (!editId || !editing) return;
    // choosing the auto-derived glyph clears the override
    setExerciseIcon(editId, icon === iconForName(editing.name) ? undefined : icon);
  }

  function doDelete(): void {
    if (!editId) return;
    if (!deleteArmed) {
      deleteArmed = true;
      return;
    }
    if (deleteExercise(editId)) {
      editOpen = false;
      toast('Exercise deleted');
    }
  }

  $effect(() => {
    if (!editOpen) deleteArmed = false;
  });
</script>

<header>
  <a href="#/settings" aria-label="Back to settings">
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 5l-7 7 7 7" /></svg>
  </a>
  <h1 class="display">Exercises</h1>
</header>

{#if !sorted.length}
  <p class="empty">No exercises yet — they're created the first time you log them.</p>
{/if}

<div class="list">
  {#each sorted as e (e.id)}
    <button class="item" onclick={() => openEdit(e.id)}>
      <span class="icon-tile" aria-hidden="true"><ExerciseIcon name={e.name} icon={e.icon} size={19} /></span>
      <span class="item-name">{e.name}</span>
      <span class="usage">{exerciseUsageCount(e.id)}×</span>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="chev"><path d="M9 6l6 6-6 6" /></svg>
    </button>
  {/each}
</div>

<Sheet bind:open={editOpen}>
  {#if editing}
    <h2 class="sheet-h">Edit exercise</h2>
    <input
      class:error={nameError}
      bind:value={nameDraft}
      onblur={commitName}
      onkeydown={(e) => e.key === 'Enter' && commitName()}
      aria-label="Exercise name"
    />
    {#if nameError}<p class="err-text">That name is empty or already taken.</p>{/if}
    <p class="hint">Icon</p>
    <div class="icon-grid">
      {#each ICON_IDS as id (id)}
        <button
          class="icon-choice"
          class:on={(editing.icon ?? iconForName(editing.name)) === id}
          aria-label={`Icon ${id}`}
          onclick={() => pickIcon(id)}
        >
          <ExerciseIcon name="" icon={id} size={22} />
        </button>
      {/each}
    </div>
    {#if usage > 0}
      <p class="hint">
        Used in {usage} {usage === 1 ? 'workout' : 'workouts'} — it can be renamed but not deleted.
      </p>
    {:else}
      <button class="danger-bg" onclick={doDelete}>
        {deleteArmed ? 'Tap again to confirm' : 'Delete exercise'}
      </button>
    {/if}
    <button class="cancel" onclick={() => (editOpen = false)}>Done</button>
  {/if}
</Sheet>

<style>
  header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 10px 0 20px;
  }
  header a {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    color: var(--text-dim);
  }
  h1 {
    font-size: 2.1rem;
    line-height: 1;
  }
  .empty {
    color: var(--text-dim);
    text-align: center;
    padding: 40px 0;
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .item {
    display: flex;
    align-items: center;
    gap: 12px;
    text-align: left;
    padding: 10px 12px;
    background: var(--surface-grad);
    border: 1px solid var(--hairline);
    border-radius: var(--radius);
    font-weight: 600;
  }
  .item:active {
    background: var(--surface-2);
  }
  .icon-tile {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    border-radius: 11px;
    background: var(--surface-2);
    border: 1px solid var(--hairline);
    color: var(--accent);
  }
  .item-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .usage {
    font-size: 0.8rem;
    color: var(--text-dim);
    font-variant-numeric: tabular-nums;
  }
  .chev {
    color: var(--text-dim);
  }
  .sheet-h {
    font-size: 1.1rem;
  }
  input.error {
    outline: 2px solid var(--danger);
    outline-offset: -1px;
  }
  .err-text {
    color: var(--danger);
    font-size: 0.85rem;
  }
  .hint {
    font-size: 0.85rem;
    color: var(--text-dim);
  }
  .icon-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 8px;
  }
  .icon-choice {
    aspect-ratio: 1;
    display: grid;
    place-items: center;
    border-radius: 12px;
    background: var(--surface-2);
    border: 1px solid var(--hairline);
    color: var(--text-dim);
    transition: color 0.12s ease, border-color 0.12s ease;
  }
  .icon-choice.on {
    color: var(--accent);
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .danger-bg {
    background: var(--danger);
    color: var(--on-danger);
    font-weight: 700;
    padding: 14px;
    border-radius: var(--radius);
  }
  .cancel {
    color: var(--text-dim);
    padding: 8px;
  }
</style>
