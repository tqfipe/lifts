import { beforeEach, describe, expect, it } from 'vitest';
import type { Entry } from './types';
import {
  _resetForTests,
  activeWorkout,
  addExerciseToWorkout,
  app,
  getWorkout,
  setEntryWeight,
  startWorkout,
  toggleEntryLogged,
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
