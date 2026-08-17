import { beforeEach, describe, expect, it } from 'vitest';
import type { Entry } from './types';
import { emptyState } from './types';
import { parseImport } from './importer';
import {
  _resetForTests,
  activeWorkout,
  addExerciseToWorkout,
  addSet,
  app,
  applyImport,
  deleteWorkout,
  finishWorkout,
  getWorkout,
  moveEntry,
  removeSet,
  deleteExercise,
  exerciseUsageCount,
  renameExercise,
  saveAsTemplate,
  setEntryNote,
  setExerciseIcon,
  setEntryWeight,
  startWorkout,
  toggleEntryLogged,
  updateSet,
  wipeAll,
  workoutDiffersFromTemplate,
} from './store.svelte';

function seedFinished(exerciseId: string, weight: number, date: string, extra: Partial<Entry> = {}): void {
  app.data.workouts.push({
    id: `seed-${date}-${exerciseId}`,
    startedAt: date,
    finishedAt: date,
    entries: [{ exerciseId, weight, logged: true, isPB: false, ...extra }],
  });
}

beforeEach(() => {
  _resetForTests();
});

describe('startWorkout', () => {
  it('creates an empty in-progress workout', () => {
    const id = startWorkout();
    const w = getWorkout(id);
    expect(w?.entries).toEqual([]);
    expect(w?.finishedAt).toBeUndefined();
    expect(activeWorkout()?.id).toBe(id);
  });

  it('returns the existing active workout instead of stacking a second one', () => {
    const first = startWorkout();
    expect(startWorkout()).toBe(first);
    expect(app.data.workouts).toHaveLength(1);
  });

  it('prefills template exercises with predicted weights', () => {
    app.data.exercises.push({ id: 'row', name: 'Row' }, { id: 'rdl', name: 'RDL' });
    app.data.templates.push({ id: 't1', name: 'Pull day', exerciseIds: ['row', 'rdl'] });
    seedFinished('row', 65, '2026-01-08T12:00:00Z');
    const w = getWorkout(startWorkout('t1'))!;
    expect(w.entries.map((e) => [e.exerciseId, e.weight, e.logged])).toEqual([
      ['row', 65, false],
      ['rdl', 0, false],
    ]);
  });
});

describe('addExerciseToWorkout', () => {
  it('reuses an existing exercise by normalized name and predicts its weight', () => {
    app.data.exercises.push({ id: 'row', name: 'Row' });
    seedFinished('row', 65, '2026-01-08T12:00:00Z');
    const id = startWorkout();
    addExerciseToWorkout(id, '  row ');
    expect(app.data.exercises).toHaveLength(1);
    expect(getWorkout(id)?.entries[0]).toMatchObject({ exerciseId: 'row', weight: 65, logged: false });
  });

  it('creates new exercises with cleaned names, and ignores duplicates in the same workout', () => {
    const id = startWorkout();
    addExerciseToWorkout(id, '  Hack   squat ');
    addExerciseToWorkout(id, 'hack squat');
    expect(app.data.exercises).toHaveLength(1);
    expect(app.data.exercises[0].name).toBe('Hack squat');
    expect(getWorkout(id)?.entries).toHaveLength(1);
  });
});

describe('toggleEntryLogged + PB stamping', () => {
  it('stamps a PB when strictly beating history', () => {
    app.data.exercises.push({ id: 'row', name: 'Row' });
    seedFinished('row', 70, '2026-01-08T12:00:00Z');
    const id = startWorkout();
    addExerciseToWorkout(id, 'Row');
    setEntryWeight(id, 'row', 72.5);
    toggleEntryLogged(id, 'row');
    expect(getWorkout(id)?.entries[0]).toMatchObject({ logged: true, isPB: true });
  });

  it('does not stamp on ties or first-ever logs', () => {
    app.data.exercises.push({ id: 'row', name: 'Row' }, { id: 'new', name: 'New thing' });
    seedFinished('row', 70, '2026-01-08T12:00:00Z');
    const id = startWorkout();
    addExerciseToWorkout(id, 'Row');
    setEntryWeight(id, 'row', 70);
    toggleEntryLogged(id, 'row');
    addExerciseToWorkout(id, 'New thing');
    setEntryWeight(id, 'new', 40);
    toggleEntryLogged(id, 'new');
    const entries = getWorkout(id)!.entries;
    expect(entries.map((e) => e.isPB)).toEqual([false, false]);
  });

  it('clears the flag when un-logging, and restamps when weight changes while logged', () => {
    app.data.exercises.push({ id: 'row', name: 'Row' });
    seedFinished('row', 70, '2026-01-08T12:00:00Z');
    const id = startWorkout();
    addExerciseToWorkout(id, 'Row');
    setEntryWeight(id, 'row', 75);
    toggleEntryLogged(id, 'row');
    expect(getWorkout(id)?.entries[0].isPB).toBe(true);
    setEntryWeight(id, 'row', 60);
    expect(getWorkout(id)?.entries[0].isPB).toBe(false);
    toggleEntryLogged(id, 'row');
    expect(getWorkout(id)?.entries[0]).toMatchObject({ logged: false, isPB: false });
  });
});

describe('sets', () => {
  function setup(): string {
    app.data.exercises.push({ id: 'row', name: 'Row' });
    const id = startWorkout();
    addExerciseToWorkout(id, 'Row');
    setEntryWeight(id, 'row', 60);
    return id;
  }

  it('addSet copies the previous weight and syncs the headline to the max set', () => {
    const id = setup();
    addSet(id, 'row');
    expect(getWorkout(id)?.entries[0].sets).toEqual([{ weight: 60 }]);
    updateSet(id, 'row', 0, { weight: 70, reps: 8 });
    addSet(id, 'row');
    expect(getWorkout(id)?.entries[0].sets).toEqual([{ weight: 70, reps: 8 }, { weight: 70 }]);
    expect(getWorkout(id)?.entries[0].weight).toBe(70);
  });

  it('a heavier set while logged stamps a PB', () => {
    app.data.workouts.push({
      id: 'hist',
      startedAt: '2026-01-01T12:00:00Z',
      finishedAt: '2026-01-01T12:00:00Z',
      entries: [{ exerciseId: 'row', weight: 65, logged: true, isPB: false }],
    });
    const id = setup();
    toggleEntryLogged(id, 'row');
    expect(getWorkout(id)?.entries[0].isPB).toBe(false);
    addSet(id, 'row');
    updateSet(id, 'row', 0, { weight: 67.5 });
    expect(getWorkout(id)?.entries[0].isPB).toBe(true);
  });

  it('removeSet clears the sets array when empty', () => {
    const id = setup();
    addSet(id, 'row');
    removeSet(id, 'row', 0);
    expect(getWorkout(id)?.entries[0].sets).toBeUndefined();
  });
});

describe('notes and reorder', () => {
  it('setEntryNote stores text and clears empties', () => {
    app.data.exercises.push({ id: 'row', name: 'Row' });
    const id = startWorkout();
    addExerciseToWorkout(id, 'Row');
    setEntryNote(id, 'row', 'with straps');
    expect(getWorkout(id)?.entries[0].note).toBe('with straps');
    setEntryNote(id, 'row', '  ');
    expect(getWorkout(id)?.entries[0].note).toBeUndefined();
  });

  it('moveEntry reorders', () => {
    const id = startWorkout();
    addExerciseToWorkout(id, 'A');
    addExerciseToWorkout(id, 'B');
    addExerciseToWorkout(id, 'C');
    moveEntry(id, 0, 2);
    const names = getWorkout(id)!.entries.map(
      (e) => app.data.exercises.find((x) => x.id === e.exerciseId)!.name,
    );
    expect(names).toEqual(['B', 'C', 'A']);
  });
});

describe('finish and templates', () => {
  it('finishWorkout keeps only logged entries and stamps finishedAt', () => {
    const id = startWorkout();
    addExerciseToWorkout(id, 'A');
    addExerciseToWorkout(id, 'B');
    const exA = app.data.exercises.find((e) => e.name === 'A')!.id;
    toggleEntryLogged(id, exA);
    finishWorkout(id);
    const w = getWorkout(id)!;
    expect(w.finishedAt).toBeDefined();
    expect(w.entries).toHaveLength(1);
    expect(activeWorkout()).toBeNull();
  });

  it('finishWorkout discards a workout with nothing logged', () => {
    const id = startWorkout();
    addExerciseToWorkout(id, 'A');
    finishWorkout(id);
    expect(getWorkout(id)).toBeUndefined();
  });

  it('workoutDiffersFromTemplate detects changes and blank starts', () => {
    app.data.exercises.push({ id: 'row', name: 'Row' }, { id: 'rdl', name: 'RDL' });
    app.data.templates.push({ id: 't1', name: 'Pull', exerciseIds: ['row', 'rdl'] });
    const id = startWorkout('t1');
    expect(workoutDiffersFromTemplate(getWorkout(id)!)).toBe(false);
    addExerciseToWorkout(id, 'New');
    expect(workoutDiffersFromTemplate(getWorkout(id)!)).toBe(true);
    deleteWorkout(id);
    const blank = startWorkout();
    expect(workoutDiffersFromTemplate(getWorkout(blank)!)).toBe(true);
  });

  it('saveAsTemplate snapshots the exercise order', () => {
    const id = startWorkout();
    addExerciseToWorkout(id, 'A');
    addExerciseToWorkout(id, 'B');
    const tid = saveAsTemplate(id, 'My day');
    const t = app.data.templates.find((x) => x.id === tid)!;
    expect(t.name).toBe('My day');
    expect(t.exerciseIds).toEqual(getWorkout(id)!.entries.map((e) => e.exerciseId));
  });
});

describe('PB restamping after edits to finished workouts', () => {
  it('lowering a finished workout weight restamps a later workout to isPB=true', () => {
    app.data.exercises.push({ id: 'row', name: 'Row' });
    seedFinished('row', 70, '2026-01-01T12:00:00Z');
    seedFinished('row', 65, '2026-01-08T12:00:00Z');
    setEntryWeight('seed-2026-01-01T12:00:00Z-row', 'row', 50);
    expect(getWorkout('seed-2026-01-08T12:00:00Z-row')?.entries[0].isPB).toBe(true);
  });

  it('deleting the old PB workout restamps a later workout to isPB=true', () => {
    app.data.exercises.push({ id: 'row', name: 'Row' });
    seedFinished('row', 50, '2026-01-01T12:00:00Z');
    seedFinished('row', 80, '2026-01-08T12:00:00Z');
    seedFinished('row', 65, '2026-01-15T12:00:00Z');
    expect(getWorkout('seed-2026-01-15T12:00:00Z-row')?.entries[0].isPB).toBe(false);
    deleteWorkout('seed-2026-01-08T12:00:00Z-row');
    expect(getWorkout('seed-2026-01-15T12:00:00Z-row')?.entries[0].isPB).toBe(true);
  });
});

describe('wipeAll', () => {
  it('resets to empty state', () => {
    startWorkout();
    wipeAll();
    expect(app.data).toEqual(emptyState());
  });
});

describe('applyImport', () => {
  it('replace mode swaps the whole state', () => {
    startWorkout();
    const incoming = emptyState();
    incoming.exercises.push({ id: 'x', name: 'X' });
    applyImport(incoming, 'replace');
    expect(app.data.exercises).toEqual([{ id: 'x', name: 'X' }]);
    expect(app.data.workouts).toEqual([]);
  });

  it('merge mode keeps current data and adds incoming', () => {
    app.data.exercises.push({ id: 'row', name: 'Row' });
    const incoming = emptyState();
    incoming.exercises.push({ id: 'inc', name: 'RDL' });
    applyImport(incoming, 'merge');
    expect(app.data.exercises.map((e) => e.name).sort()).toEqual(['RDL', 'Row']);
  });

  it('merge mode does not throw when incoming is a Svelte reactive proxy', () => {
    app.data.exercises.push({ id: 'row', name: 'Row' });
    const plain = emptyState();
    plain.exercises.push({ id: 'inc', name: 'RDL' });
    // Mirrors a component holding the parsed import result in `$state`,
    // which makes `incoming` a reactive proxy rather than a plain object.
    const reactiveIncoming = $state(plain);
    expect(() => applyImport(reactiveIncoming, 'merge')).not.toThrow();
    expect(app.data.exercises.map((e) => e.name).sort()).toEqual(['RDL', 'Row']);
  });
});

describe('exercise CRUD', () => {
  function seedExercises(): void {
    app.data.exercises.push({ id: 'row', name: 'Row' }, { id: 'oops', name: 'Msitake' });
    seedFinished('row', 60, '2026-01-05T12:00:00Z');
    app.data.templates.push({ id: 't1', name: 'Pull', exerciseIds: ['row', 'oops'] });
  }

  it('counts usage across workouts', () => {
    seedExercises();
    expect(exerciseUsageCount('row')).toBe(1);
    expect(exerciseUsageCount('oops')).toBe(0);
  });

  it('renames, rejecting empty and colliding names', () => {
    seedExercises();
    expect(renameExercise('oops', 'Mistake fixed')).toBe(true);
    expect(app.data.exercises.find((e) => e.id === 'oops')?.name).toBe('Mistake fixed');
    expect(renameExercise('oops', '  row ')).toBe(false); // collides with Row
    expect(renameExercise('oops', '   ')).toBe(false);
    expect(renameExercise('oops', 'Mistake FIXED')).toBe(true); // recasing itself is fine
  });

  it('sets and clears an icon override', () => {
    seedExercises();
    setExerciseIcon('oops', 'curl');
    expect(app.data.exercises.find((e) => e.id === 'oops')?.icon).toBe('curl');
    setExerciseIcon('oops', undefined);
    expect(app.data.exercises.find((e) => e.id === 'oops')?.icon).toBeUndefined();
  });

  it('deletes only unused exercises, cleaning templates', () => {
    seedExercises();
    expect(deleteExercise('row')).toBe(false); // has history
    expect(app.data.exercises.some((e) => e.id === 'row')).toBe(true);
    expect(deleteExercise('oops')).toBe(true);
    expect(app.data.exercises.some((e) => e.id === 'oops')).toBe(false);
    expect(app.data.templates[0].exerciseIds).toEqual(['row']);
  });
});
