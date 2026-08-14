<script lang="ts">
  import { flip } from 'svelte/animate';
  import ExercisePicker from '../components/ExercisePicker.svelte';
  import ExerciseRow from '../components/ExerciseRow.svelte';
  import Sheet from '../components/Sheet.svelte';
  import WeightSheet from '../components/WeightSheet.svelte';
  import { navigate } from '../lib/router';
  import { reorderable } from '../lib/reorderable';
  import {
    addExerciseToWorkout,
    app,
    deleteWorkout,
    finishWorkout,
    moveEntry,
    saveAsTemplate,
    setEntryWeight,
    setWorkoutNote,
    updateSet,
    workoutDiffersFromTemplate,
  } from '../lib/store.svelte';
  import { toast } from '../lib/toast.svelte';

  let { id }: { id: string } = $props();

  const workout = $derived(app.data.workouts.find((w) => w.id === id));
  const isFinished = $derived(!!workout?.finishedAt);
  let editing = $state(false);
  const readonly = $derived(isFinished && !editing);

  $effect(() => {
    if (app.ready && !workout) navigate('/');
  });

  let pickerOpen = $state(false);
  let finishOpen = $state(false);
  let deleteOpen = $state(false);
  let weightTarget = $state<{ exerciseId: string; setIndex?: number } | null>(null);
  let weightOpen = $state(false);
  let workoutNote = $state('');
  let saveTemplate = $state(false);
  let templateName = $state('');

  const loggedCount = $derived(workout?.entries.filter((e) => e.logged).length ?? 0);
  const offerTemplate = $derived(workout ? workoutDiffersFromTemplate(workout) : false);

  const weightValue = $derived.by(() => {
    if (!workout || !weightTarget) return 0;
    const e = workout.entries.find((x) => x.exerciseId === weightTarget!.exerciseId);
    if (!e) return 0;
    return weightTarget!.setIndex == null ? e.weight : (e.sets?.[weightTarget!.setIndex]?.weight ?? e.weight);
  });

  const weightTitle = $derived.by(() => {
    if (!weightTarget) return '';
    const name = app.data.exercises.find((x) => x.id === weightTarget!.exerciseId)?.name ?? '';
    return weightTarget!.setIndex == null ? name : `${name} — set ${weightTarget!.setIndex + 1}`;
  });

  function openWeight(exerciseId: string, setIndex?: number): void {
    weightTarget = { exerciseId, setIndex };
    weightOpen = true;
  }

  function applyWeight(v: number): void {
    if (!weightTarget) return;
    if (weightTarget.setIndex == null) setEntryWeight(id, weightTarget.exerciseId, v);
    else updateSet(id, weightTarget.exerciseId, weightTarget.setIndex, { weight: v });
  }

  function openFinish(): void {
    workoutNote = workout?.note ?? '';
    saveTemplate = false;
    templateName = '';
    finishOpen = true;
  }

  function confirmFinish(): void {
    const anyLogged = loggedCount > 0;
    setWorkoutNote(id, workoutNote);
    finishWorkout(id);
    if (anyLogged && saveTemplate && templateName.trim()) saveAsTemplate(id, templateName.trim());
    finishOpen = false;
    navigate('/');
    toast(anyLogged ? 'Workout saved' : 'Nothing logged — workout discarded');
  }

  function confirmDelete(): void {
    deleteOpen = false;
    deleteWorkout(id);
    navigate('/');
    toast('Workout deleted');
  }

  function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }
</script>

{#if workout}
  <header>
    <a href="#/" aria-label="Back">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 5l-7 7 7 7" /></svg>
    </a>
    <div class="head-mid">
      <span class="date">{fmtDate(workout.startedAt)}</span>
      {#if !isFinished}<span class="count">{loggedCount}/{workout.entries.length} logged</span>{/if}
    </div>
    {#if isFinished && !editing}
      <button class="head-btn" onclick={() => (editing = true)}>Edit</button>
    {:else if isFinished}
      <button class="head-btn" onclick={() => (editing = false)}>Done</button>
    {/if}
    <button class="head-btn danger" aria-label="Delete workout" onclick={() => (deleteOpen = true)}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6" /></svg>
    </button>
  </header>

  <div class="rows">
    {#each workout.entries as entry, i (entry.exerciseId)}
      <div
        animate:flip={{ duration: 200 }}
        use:reorderable={{
          index: i,
          count: workout.entries.length,
          onreorder: (from, to) => moveEntry(id, from, to),
          enabled: !readonly,
        }}
      >
        <ExerciseRow workoutId={id} {entry} {readonly} onweight={(setIndex) => openWeight(entry.exerciseId, setIndex)} />
      </div>
    {/each}
  </div>

  {#if !readonly}
    <button class="add" onclick={() => (pickerOpen = true)}>+ Add exercise</button>
  {/if}

  {#if workout.note && readonly}
    <p class="workout-note">{workout.note}</p>
  {/if}

  {#if !isFinished}
    <button class="finish" disabled={!workout.entries.length} onclick={openFinish}>Finish workout</button>
  {/if}
{/if}

<ExercisePicker
  bind:open={pickerOpen}
  exclude={workout?.entries.map((e) => e.exerciseId) ?? []}
  onpick={(name) => addExerciseToWorkout(id, name)}
/>

<WeightSheet
  bind:open={weightOpen}
  value={weightValue}
  step={app.data.settings.weightStep}
  title={weightTitle}
  onapply={applyWeight}
/>

<Sheet bind:open={finishOpen}>
  <h2 class="sheet-h">Finish workout</h2>
  <textarea rows="2" placeholder="Workout note (optional)" bind:value={workoutNote}></textarea>
  {#if offerTemplate && loggedCount > 0}
    <label class="tpl-toggle">
      <input type="checkbox" bind:checked={saveTemplate} />
      Save as template
    </label>
    {#if saveTemplate}
      <input placeholder="Template name" bind:value={templateName} />
    {/if}
  {/if}
  <button class="confirm" onclick={confirmFinish}>
    {loggedCount > 0 ? `Save ${loggedCount} ${loggedCount === 1 ? 'exercise' : 'exercises'}` : 'Discard workout'}
  </button>
</Sheet>

<Sheet bind:open={deleteOpen}>
  <h2 class="sheet-h">Delete this workout?</h2>
  <p class="sheet-sub">This can’t be undone.</p>
  <button class="confirm danger-bg" onclick={confirmDelete}>Delete</button>
  <button class="cancel" onclick={() => (deleteOpen = false)}>Cancel</button>
</Sheet>

<style>
  header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 18px;
  }
  header a {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    color: var(--text-dim);
  }
  .head-mid {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .date {
    font-weight: 700;
  }
  .count {
    font-size: 0.8rem;
    color: var(--text-dim);
  }
  .head-btn {
    color: var(--accent);
    font-weight: 600;
    padding: 8px;
  }
  .head-btn.danger {
    color: var(--text-dim);
  }
  .rows {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .add {
    width: 100%;
    margin-top: 12px;
    padding: 14px;
    border: 1px dashed var(--border);
    border-radius: var(--radius);
    color: var(--text-dim);
    font-weight: 600;
  }
  .workout-note {
    margin-top: 16px;
    color: var(--text-dim);
    font-style: italic;
  }
  .finish {
    position: sticky;
    bottom: calc(12px + env(safe-area-inset-bottom));
    width: 100%;
    margin-top: 20px;
    padding: 17px;
    border-radius: var(--radius-lg);
    background: var(--accent);
    color: #04120a;
    font-weight: 700;
    font-size: 1.05rem;
    box-shadow: var(--shadow);
    transition: transform 0.1s ease;
  }
  .finish:active {
    transform: scale(0.97);
  }
  .finish:disabled {
    opacity: 0.4;
  }
  .sheet-h {
    font-size: 1.1rem;
  }
  .sheet-sub {
    color: var(--text-dim);
    font-size: 0.9rem;
  }
  .tpl-toggle {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
  }
  .tpl-toggle input {
    width: auto;
    accent-color: var(--accent);
  }
  .confirm {
    background: var(--accent);
    color: #04120a;
    font-weight: 700;
    padding: 15px;
    border-radius: var(--radius);
  }
  .confirm.danger-bg {
    background: var(--danger);
    color: #fff;
  }
  .cancel {
    color: var(--text-dim);
    padding: 8px;
  }
</style>
