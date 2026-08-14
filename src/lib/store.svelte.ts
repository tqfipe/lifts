import { computePBs, entryMaxWeight, predictWeight, restampPBFlags } from './derive';
import { newId } from './id';
import { mergeStates } from './importer';
import { cleanName, findExerciseByName } from './normalize';
import { flushSave, loadState, scheduleSave } from './storage';
import { emptyState, type AppState, type Entry, type SetRecord, type Workout } from './types';

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
  if (found.w.finishedAt) restampPBFlags(app.data.workouts);
  else if (found.e.logged) stampPB(found.w, found.e);
  persist();
}

export function toggleEntryLogged(workoutId: string, exerciseId: string): void {
  const found = getEntry(workoutId, exerciseId);
  if (!found) return;
  found.e.logged = !found.e.logged;
  if (found.w.finishedAt) restampPBFlags(app.data.workouts);
  else if (found.e.logged) stampPB(found.w, found.e);
  else found.e.isPB = false;
  persist();
}

export function _resetForTests(): void {
  app.data = emptyState();
  app.ready = true;
}

function syncHeadline(e: Entry): void {
  if (e.sets?.length) e.weight = Math.max(...e.sets.map((s) => s.weight));
}

export function addSet(workoutId: string, exerciseId: string): void {
  const found = getEntry(workoutId, exerciseId);
  if (!found) return;
  const sets = (found.e.sets ??= []);
  sets.push({ weight: sets.length ? sets[sets.length - 1].weight : found.e.weight });
  syncHeadline(found.e);
  if (found.w.finishedAt) restampPBFlags(app.data.workouts);
  else if (found.e.logged) stampPB(found.w, found.e);
  persist();
}

export function updateSet(
  workoutId: string,
  exerciseId: string,
  index: number,
  patch: Partial<SetRecord>,
): void {
  const found = getEntry(workoutId, exerciseId);
  const set = found?.e.sets?.[index];
  if (!found || !set) return;
  Object.assign(set, patch);
  syncHeadline(found.e);
  if (found.w.finishedAt) restampPBFlags(app.data.workouts);
  else if (found.e.logged) stampPB(found.w, found.e);
  persist();
}

export function removeSet(workoutId: string, exerciseId: string, index: number): void {
  const found = getEntry(workoutId, exerciseId);
  if (!found?.e.sets) return;
  found.e.sets.splice(index, 1);
  if (!found.e.sets.length) delete found.e.sets;
  else syncHeadline(found.e);
  if (found.w.finishedAt) restampPBFlags(app.data.workouts);
  else if (found.e.logged) stampPB(found.w, found.e);
  persist();
}

export function setEntryReps(workoutId: string, exerciseId: string, reps: number | undefined): void {
  const found = getEntry(workoutId, exerciseId);
  if (!found) return;
  if (reps === undefined) delete found.e.reps;
  else found.e.reps = reps;
  persist();
}

export function setEntryNote(workoutId: string, exerciseId: string, note: string): void {
  const found = getEntry(workoutId, exerciseId);
  if (!found) return;
  if (note.trim()) found.e.note = note;
  else delete found.e.note;
  persist();
}

export function setWorkoutNote(workoutId: string, note: string): void {
  const w = getWorkout(workoutId);
  if (!w) return;
  if (note.trim()) w.note = note;
  else delete w.note;
  persist();
}

export function removeEntry(workoutId: string, exerciseId: string): void {
  const w = getWorkout(workoutId);
  if (!w) return;
  w.entries = w.entries.filter((e) => e.exerciseId !== exerciseId);
  if (w.finishedAt) restampPBFlags(app.data.workouts);
  persist();
}

export function moveEntry(workoutId: string, from: number, to: number): void {
  const w = getWorkout(workoutId);
  if (!w || from === to || from < 0 || from >= w.entries.length) return;
  const [moved] = w.entries.splice(from, 1);
  w.entries.splice(Math.max(0, Math.min(to, w.entries.length)), 0, moved);
  persist();
}

export function finishWorkout(workoutId: string): void {
  const w = getWorkout(workoutId);
  if (!w || w.finishedAt) return;
  w.entries = w.entries.filter((e) => e.logged);
  if (!w.entries.length) {
    app.data.workouts = app.data.workouts.filter((x) => x.id !== workoutId);
  } else {
    w.finishedAt = new Date().toISOString();
  }
  restampPBFlags(app.data.workouts);
  persist();
}

export function workoutDiffersFromTemplate(w: Workout): boolean {
  const t = app.data.templates.find((x) => x.id === w.templateId);
  if (!t) return true;
  const ids = w.entries.map((e) => e.exerciseId);
  return ids.length !== t.exerciseIds.length || ids.some((id, i) => id !== t.exerciseIds[i]);
}

export function saveAsTemplate(workoutId: string, name: string): string {
  const w = getWorkout(workoutId);
  const id = newId();
  if (!w) return id;
  app.data.templates.push({ id, name, exerciseIds: w.entries.map((e) => e.exerciseId) });
  persist();
  return id;
}

export function deleteWorkout(id: string): void {
  app.data.workouts = app.data.workouts.filter((w) => w.id !== id);
  restampPBFlags(app.data.workouts);
  persist();
}

export function deleteTemplate(id: string): void {
  app.data.templates = app.data.templates.filter((t) => t.id !== id);
  persist();
}

export function setWeightStep(step: number): void {
  app.data.settings.weightStep = step;
  persist();
}

export function wipeAll(): void {
  app.data = emptyState();
  persist();
}

export function applyImport(incoming: AppState, mode: 'merge' | 'replace'): void {
  // `incoming` may be a Svelte reactive proxy (e.g. held in a component's
  // `$state`); structuredClone inside mergeStates/replace can't clone that,
  // so snapshot it to a plain object first.
  const inc = $state.snapshot(incoming) as AppState;
  app.data = mode === 'replace' ? inc : mergeStates($state.snapshot(app).data as AppState, inc);
  persist();
}
