<script lang="ts">
  import { scale, slide } from 'svelte/transition';
  import ExerciseIcon from './ExerciseIcon.svelte';
  import { computePBs, entryMaxWeight } from '../lib/derive';
  import type { Entry } from '../lib/types';
  import {
    addSet,
    app,
    removeEntry,
    removeSet,
    setEntryNote,
    setEntryReps,
    toggleEntryLogged,
    updateSet,
  } from '../lib/store.svelte';
  import { formatWeight, toDisplay } from '../lib/weight';

  let {
    workoutId,
    entry,
    readonly = false,
    onweight,
  }: {
    workoutId: string;
    entry: Entry;
    readonly?: boolean;
    onweight: (setIndex?: number) => void;
  } = $props();

  const exercise = $derived(app.data.exercises.find((e) => e.id === entry.exerciseId));
  const unit = $derived(app.data.settings.unit ?? 'kg');
  // PB from history (excluding this workout, like stampPB); shown as a hint
  // when the current weight differs from it, so the PB stays visible.
  const pbWeight = $derived.by(() => {
    if (readonly) return null;
    const pb = computePBs(app.data.workouts.filter((w) => w.id !== workoutId)).get(entry.exerciseId);
    if (!pb || entry.isPB || pb.weight === entryMaxWeight(entry)) return null;
    return pb.weight;
  });
  let expanded = $state(false);
  let noteOpen = $state(false);

  function rowTap(): void {
    if (readonly) return;
    toggleEntryLogged(workoutId, entry.exerciseId);
  }
</script>

<div class="wrap" class:logged={entry.logged}>
  <div
    class="row"
    onclick={rowTap}
    role="button"
    tabindex="0"
    onkeydown={(e) => e.key === 'Enter' && rowTap()}
  >
    {#if !readonly}
      <button
        class="chevron"
        class:open={expanded}
        aria-label="Details"
        onclick={(e) => {
          e.stopPropagation();
          expanded = !expanded;
        }}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6" /></svg>
      </button>
    {/if}
    <span class="icon-tile" class:lit={entry.logged} aria-hidden="true">
      <ExerciseIcon name={exercise?.name ?? ''} icon={exercise?.icon} size={18} />
    </span>
    <span class="name">{exercise?.name ?? '?'}</span>
    {#if entry.isPB}
      <span class="pb" in:scale={{ duration: 350, start: 0.4 }}>PB</span>
    {/if}
    <span class="weight-col">
      <button
        class="weight"
        onclick={(e) => {
          e.stopPropagation();
          if (!readonly) onweight();
        }}
      >
        <span class="num w-num">{formatWeight(toDisplay(entry.weight, unit))}</span><span class="unit">{unit}</span>
        {#if entry.reps != null}<span class="reps-tag">×{entry.reps}</span>{/if}
      </button>
      {#if pbWeight != null}
        <span class="pb-hint">PB {formatWeight(toDisplay(pbWeight, unit))} {unit}</span>
      {/if}
    </span>
    {#if !readonly}
      <span class="check" class:on={entry.logged} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5" /></svg>
      </span>
    {/if}
  </div>

  {#if !readonly && expanded}
    <div class="detail" transition:slide={{ duration: 180 }}>
      {#if entry.sets?.length}
        {#each entry.sets as s, i (i)}
          <div class="set">
            <span class="set-n">{i + 1}</span>
            <button class="set-weight" onclick={() => onweight(i)}>{formatWeight(toDisplay(s.weight, unit))} {unit}</button>
            <div class="stepper">
              <button onclick={() => updateSet(workoutId, entry.exerciseId, i, { reps: Math.max(0, (s.reps ?? 0) - 1) })} aria-label="Fewer reps">−</button>
              <span>{s.reps ?? '–'} reps</span>
              <button onclick={() => updateSet(workoutId, entry.exerciseId, i, { reps: (s.reps ?? 0) + 1 })} aria-label="More reps">+</button>
            </div>
            <button class="x" onclick={() => removeSet(workoutId, entry.exerciseId, i)} aria-label="Remove set">×</button>
          </div>
        {/each}
      {:else}
        <div class="set">
          <span class="set-n">reps</span>
          <div class="stepper">
            <button onclick={() => setEntryReps(workoutId, entry.exerciseId, Math.max(0, (entry.reps ?? 0) - 1))} aria-label="Fewer reps">−</button>
            <span>{entry.reps ?? '–'}</span>
            <button onclick={() => setEntryReps(workoutId, entry.exerciseId, (entry.reps ?? 0) + 1)} aria-label="More reps">+</button>
          </div>
        </div>
      {/if}
      <div class="actions">
        <button onclick={() => addSet(workoutId, entry.exerciseId)}>+ set</button>
        <button onclick={() => (noteOpen = !noteOpen)}>note</button>
        <button class="danger" onclick={() => removeEntry(workoutId, entry.exerciseId)}>remove</button>
      </div>
      {#if noteOpen || entry.note}
        <input
          class="note"
          placeholder="Note…"
          value={entry.note ?? ''}
          oninput={(e) => setEntryNote(workoutId, entry.exerciseId, e.currentTarget.value)}
        />
      {/if}
    </div>
  {/if}

  {#if readonly && (entry.sets?.length || entry.note)}
    <div class="detail read">
      {#if entry.sets?.length}
        <p class="sets-line">{entry.sets.map((s) => `${formatWeight(toDisplay(s.weight, unit))}×${s.reps ?? '?'}`).join('   ')}</p>
      {/if}
      {#if entry.note}<p class="note-line">{entry.note}</p>{/if}
    </div>
  {/if}
</div>

<style>
  .wrap {
    background: var(--surface-grad);
    border: 1px solid var(--hairline);
    border-radius: var(--radius);
    overflow: hidden;
    transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
  }
  .wrap.logged {
    border-color: var(--accent);
    background: linear-gradient(var(--accent-soft), var(--accent-soft)), var(--surface);
    box-shadow: 0 0 14px rgb(var(--accent-rgb) / 0.12);
  }
  .icon-tile {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    border-radius: 10px;
    background: var(--surface-2);
    border: 1px solid var(--hairline);
    color: var(--text-dim);
    transition: color 0.15s ease;
  }
  .icon-tile.lit {
    color: var(--accent);
  }
  .wrap:global(.dragging) {
    z-index: 10;
    opacity: 0.92;
    box-shadow: var(--shadow);
  }
  .row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 12px;
    min-height: 56px;
    cursor: pointer;
    user-select: none;
  }
  .chevron {
    color: var(--text-dim);
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
  }
  .chevron svg {
    transition: transform 0.18s ease;
  }
  .chevron.open svg {
    transform: rotate(90deg);
  }
  .name {
    flex: 1;
    font-weight: 600;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .pb {
    background: linear-gradient(110deg, var(--pb) 35%, var(--pb-hi) 50%, var(--pb) 65%);
    background-size: 250% 100%;
    animation: pb-shimmer 2.2s ease-in-out infinite;
    color: var(--on-pb);
    font-family: var(--font-display);
    font-size: 0.78rem;
    letter-spacing: 0.08em;
    padding: 3px 8px 2px;
    border-radius: 999px;
    box-shadow: 0 0 12px rgb(255 197 61 / 0.35);
  }
  .weight-col {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
  }
  .pb-hint {
    font-size: 0.68rem;
    color: var(--text-dim);
    letter-spacing: 0.03em;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .weight {
    display: inline-flex;
    align-items: baseline;
    background: var(--surface-2);
    border: 1px solid var(--hairline);
    padding: 6px 12px;
    border-radius: 11px;
  }
  .w-num {
    font-size: 1.35rem;
    line-height: 1;
  }
  .unit,
  .reps-tag {
    font-size: 0.75rem;
    color: var(--text-dim);
    font-weight: 400;
    margin-left: 3px;
  }
  .check {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    color: var(--border);
    transition: color 0.15s ease, transform 0.15s ease;
  }
  .check.on {
    color: var(--accent);
    transform: scale(1.15);
  }
  .detail {
    padding: 4px 12px 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-top: 1px solid var(--border);
  }
  .detail.read {
    padding-top: 8px;
  }
  .set {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .set-n {
    color: var(--text-dim);
    font-size: 0.8rem;
    width: 32px;
  }
  .set-weight {
    background: var(--surface-2);
    padding: 6px 10px;
    border-radius: 8px;
    font-variant-numeric: tabular-nums;
  }
  .stepper {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
  }
  .stepper span {
    min-width: 64px;
    text-align: center;
    font-variant-numeric: tabular-nums;
    color: var(--text-dim);
    font-size: 0.9rem;
  }
  .stepper button,
  .x {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: var(--surface-2);
    font-size: 1.1rem;
    line-height: 1;
  }
  .x {
    color: var(--text-dim);
  }
  .actions {
    display: flex;
    gap: 8px;
  }
  .actions button {
    font-size: 0.85rem;
    color: var(--text-dim);
    background: var(--surface-2);
    padding: 7px 12px;
    border-radius: 999px;
  }
  .actions .danger {
    color: var(--danger);
    margin-left: auto;
  }
  .sets-line,
  .note-line {
    font-size: 0.85rem;
    color: var(--text-dim);
  }
</style>
