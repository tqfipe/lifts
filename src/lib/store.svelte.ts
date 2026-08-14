import { computePBs, entryMaxWeight, predictWeight } from './derive';
import { newId } from './id';
import { cleanName, findExerciseByName } from './normalize';
import { flushSave, loadState, scheduleSave } from './storage';
import { emptyState, type AppState, type Entry, type Workout } from './types';

export const app = $state({
  data: emptyState(),
  ready: false,
});

export async function init(): Promise<void> {
  app.data = await loadState();
  app.ready = true;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flushSave();
  });
  window.addEventListener('pagehide', () => void flushSave());
}

function persist(): void {
  scheduleSave($state.snapshot(app).data as AppState);
}

export function getWorkout(id: string): Workout | undefined {
  return app.data.workouts.find((w) => w.id === id);
}

function getEntry(workoutId: string, exerciseId: string): { w: Workout; e: Entry } | null {
  const w = getWorkout(workoutId);
  const e = w?.entries.find((x) => x.exerciseId === exerciseId);
  return w && e ? { w, e } : null;
}

export function activeWorkout(): Workout | null {
  return app.data.workouts.find((w) => !w.finishedAt) ?? null;
}

export function startWorkout(templateId?: string): string {
  const existing = activeWorkout();
  if (existing) return existing.id;
  const id = newId();
  const entries: Entry[] = [];
  const template = app.data.templates.find((t) => t.id === templateId);
  for (const exerciseId of template?.exerciseIds ?? []) {
    entries.push({
      exerciseId,
      weight: predictWeight(app.data.workouts, exerciseId) ?? 0,
      logged: false,
      isPB: false,
    });
  }
  app.data.workouts.push({ id, startedAt: new Date().toISOString(), ...(template ? { templateId } : {}), entries });
  persist();
  return id;
}

export function addExerciseToWorkout(workoutId: string, name: string): void {
  const w = getWorkout(workoutId);
  if (!w) return;
  let exercise = findExerciseByName(app.data.exercises, name);
  if (!exercise) {
    exercise = { id: newId(), name: cleanName(name) };
    app.data.exercises.push(exercise);
  }
  if (w.entries.some((e) => e.exerciseId === exercise.id)) return;
  w.entries.push({
    exerciseId: exercise.id,
    weight: predictWeight(app.data.workouts, exercise.id) ?? 0,
    logged: false,
    isPB: false,
  });
  persist();
}

function stampPB(w: Workout, e: Entry): void {
  const history = app.data.workouts.filter((x) => x.id !== w.id);
  const pb = computePBs(history).get(e.exerciseId);
  e.isPB = pb !== undefined && entryMaxWeight(e) > pb.weight;
}

export function setEntryWeight(workoutId: string, exerciseId: string, weight: number): void {
  const found = getEntry(workoutId, exerciseId);
  if (!found) return;
  found.e.weight = weight;
  if (found.e.logged) stampPB(found.w, found.e);
  persist();
}

export function toggleEntryLogged(workoutId: string, exerciseId: string): void {
  const found = getEntry(workoutId, exerciseId);
  if (!found) return;
  found.e.logged = !found.e.logged;
  if (found.e.logged) stampPB(found.w, found.e);
  else found.e.isPB = false;
  persist();
}

export function _resetForTests(): void {
  app.data = emptyState();
  app.ready = true;
}
