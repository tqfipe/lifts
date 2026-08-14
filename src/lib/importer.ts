import { restampPBFlags } from './derive';
import { newId } from './id';
import { cleanName, normalizeName } from './normalize';
import {
  SCHEMA_VERSION,
  emptyState,
  type AppState,
  type Entry,
  type Exercise,
  type SetRecord,
  type Workout,
} from './types';

export interface ImportPreview {
  workouts: number;
  exercises: number;
  from?: string;
  to?: string;
}

export type ImportResult =
  | { ok: true; data: AppState; preview: ImportPreview }
  | { ok: false; error: string };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function fail(path: string, msg: string): ImportResult {
  return { ok: false, error: `${path}: ${msg}` };
}

export function parseImport(text: string): ImportResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Not valid JSON.' };
  }
  if (isRecord(json) && json.format === 'simple-v1') return fromSimple(json);
  if (isRecord(json) && typeof json.schemaVersion === 'number') return fromFull(json);
  return {
    ok: false,
    error: 'Unrecognized format — expected "format": "simple-v1" or a full backup with "schemaVersion".',
  };
}

function previewOf(state: AppState): ImportPreview {
  const dates = state.workouts.map((w) => w.startedAt).sort();
  return {
    workouts: state.workouts.length,
    exercises: state.exercises.length,
    ...(dates.length ? { from: dates[0].slice(0, 10), to: dates[dates.length - 1].slice(0, 10) } : {}),
  };
}

function fromSimple(json: Record<string, unknown>): ImportResult {
  if (!Array.isArray(json.workouts)) return fail('workouts', 'must be an array');
  const state = emptyState();
  const byName = new Map<string, Exercise>();
  for (let i = 0; i < json.workouts.length; i++) {
    const w = json.workouts[i];
    const p = `workouts[${i}]`;
    if (!isRecord(w)) return fail(p, 'must be an object');
    if (typeof w.date !== 'string' || Number.isNaN(Date.parse(w.date)))
      return fail(`${p}.date`, 'must be a date string (YYYY-MM-DD)');
    if (!Array.isArray(w.entries)) return fail(`${p}.entries`, 'must be an array');
    const startedAt = w.date.length === 10 ? `${w.date}T12:00:00.000Z` : new Date(w.date).toISOString();
    const workout: Workout = { id: newId(), startedAt, finishedAt: startedAt, entries: [] };
    if (typeof w.note === 'string' && w.note) workout.note = w.note;
    for (let j = 0; j < w.entries.length; j++) {
      const e = w.entries[j];
      const q = `${p}.entries[${j}]`;
      if (!isRecord(e)) return fail(q, 'must be an object');
      if (typeof e.exercise !== 'string' || !e.exercise.trim())
        return fail(`${q}.exercise`, 'must be a non-empty string');
      if (typeof e.weight !== 'number' || !Number.isFinite(e.weight) || e.weight < 0)
        return fail(`${q}.weight`, 'must be a non-negative number');
      const key = normalizeName(e.exercise);
      let exercise = byName.get(key);
      if (!exercise) {
        exercise = { id: newId(), name: cleanName(e.exercise) };
        byName.set(key, exercise);
        state.exercises.push(exercise);
      }
      const entry: Entry = { exerciseId: exercise.id, weight: e.weight, logged: true, isPB: false };
      if (typeof e.reps === 'number') entry.reps = e.reps;
      if (typeof e.note === 'string' && e.note) entry.note = e.note;
      if (Array.isArray(e.sets) && e.sets.length) {
        const sets: SetRecord[] = [];
        for (let k = 0; k < e.sets.length; k++) {
          const s = e.sets[k];
          if (!isRecord(s) || typeof s.weight !== 'number' || !Number.isFinite(s.weight))
            return fail(`${q}.sets[${k}].weight`, 'must be a number');
          const rec: SetRecord = { weight: s.weight };
          if (typeof s.reps === 'number') rec.reps = s.reps;
          sets.push(rec);
        }
        entry.sets = sets;
        entry.weight = Math.max(e.weight, ...sets.map((s) => s.weight));
      }
      workout.entries.push(entry);
    }
    state.workouts.push(workout);
  }
  state.workouts.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  restampPBFlags(state.workouts);
  return { ok: true, data: state, preview: previewOf(state) };
}

function fromFull(json: Record<string, unknown>): ImportResult {
  if (json.schemaVersion !== SCHEMA_VERSION) return fail('schemaVersion', `must be ${SCHEMA_VERSION}`);
  for (const key of ['exercises', 'workouts', 'templates'] as const) {
    if (!Array.isArray(json[key])) return fail(key, 'must be an array');
  }
  const state = emptyState();
  const exercises = json.exercises as unknown[];
  for (let i = 0; i < exercises.length; i++) {
    const e = exercises[i];
    if (!isRecord(e) || typeof e.id !== 'string' || typeof e.name !== 'string')
      return fail(`exercises[${i}]`, 'must have string id and name');
    state.exercises.push({ id: e.id, name: e.name });
  }
  const workouts = json.workouts as unknown[];
  for (let i = 0; i < workouts.length; i++) {
    const w = workouts[i];
    const p = `workouts[${i}]`;
    if (!isRecord(w) || typeof w.id !== 'string' || typeof w.startedAt !== 'string')
      return fail(p, 'must have string id and startedAt');
    if (!Array.isArray(w.entries)) return fail(`${p}.entries`, 'must be an array');
    const workout: Workout = { id: w.id, startedAt: w.startedAt, entries: [] };
    if (typeof w.finishedAt === 'string') workout.finishedAt = w.finishedAt;
    if (typeof w.templateId === 'string') workout.templateId = w.templateId;
    if (typeof w.note === 'string' && w.note) workout.note = w.note;
    for (let j = 0; j < w.entries.length; j++) {
      const e = w.entries[j];
      const q = `${p}.entries[${j}]`;
      if (!isRecord(e) || typeof e.exerciseId !== 'string')
        return fail(q, 'must have a string exerciseId');
      if (typeof e.weight !== 'number' || !Number.isFinite(e.weight))
        return fail(`${q}.weight`, 'must be a number');
      const entry: Entry = {
        exerciseId: e.exerciseId,
        weight: e.weight,
        logged: typeof e.logged === 'boolean' ? e.logged : true,
        isPB: false,
      };
      if (typeof e.reps === 'number') entry.reps = e.reps;
      if (typeof e.note === 'string' && e.note) entry.note = e.note;
      if (Array.isArray(e.sets) && e.sets.length) {
        const sets: SetRecord[] = [];
        for (let k = 0; k < e.sets.length; k++) {
          const s = e.sets[k];
          if (!isRecord(s) || typeof s.weight !== 'number')
            return fail(`${q}.sets[${k}].weight`, 'must be a number');
          const rec: SetRecord = { weight: s.weight };
          if (typeof s.reps === 'number') rec.reps = s.reps;
          sets.push(rec);
        }
        entry.sets = sets;
      }
      workout.entries.push(entry);
    }
    state.workouts.push(workout);
  }
  const templates = json.templates as unknown[];
  for (let i = 0; i < templates.length; i++) {
    const t = templates[i];
    if (
      !isRecord(t) ||
      typeof t.id !== 'string' ||
      typeof t.name !== 'string' ||
      !Array.isArray(t.exerciseIds) ||
      t.exerciseIds.some((x) => typeof x !== 'string')
    )
      return fail(`templates[${i}]`, 'must have string id, name, and exerciseIds');
    state.templates.push({ id: t.id, name: t.name, exerciseIds: t.exerciseIds as string[] });
  }
  if (isRecord(json.settings)) {
    const s = json.settings;
    if (typeof s.weightStep === 'number' && s.weightStep > 0) state.settings.weightStep = s.weightStep;
    if (s.unit === 'kg' || s.unit === 'lb') state.settings.unit = s.unit;
    if (
      s.theme === 'emerald' ||
      s.theme === 'volt' ||
      s.theme === 'inferno' ||
      s.theme === 'ice' ||
      s.theme === 'violet'
    )
      state.settings.theme = s.theme;
  }
  state.workouts.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  restampPBFlags(state.workouts);
  return { ok: true, data: state, preview: previewOf(state) };
}

export function mergeStates(current: AppState, incoming: AppState): AppState {
  const merged: AppState = structuredClone(current);
  const idMap = new Map<string, string>();
  for (const ex of incoming.exercises) {
    const existing = merged.exercises.find((e) => normalizeName(e.name) === normalizeName(ex.name));
    if (existing) {
      idMap.set(ex.id, existing.id);
      continue;
    }
    const idTaken = merged.exercises.some((e) => e.id === ex.id);
    const id = idTaken ? newId() : ex.id;
    idMap.set(ex.id, id);
    merged.exercises.push({ id, name: ex.name });
  }
  const remap = (exId: string): string => idMap.get(exId) ?? exId;
  for (const w of incoming.workouts) {
    if (merged.workouts.some((x) => x.id === w.id)) continue;
    const clone = structuredClone(w);
    clone.entries = clone.entries.map((e) => ({ ...e, exerciseId: remap(e.exerciseId) }));
    merged.workouts.push(clone);
  }
  for (const t of incoming.templates) {
    if (merged.templates.some((x) => x.id === t.id)) continue;
    merged.templates.push({ ...structuredClone(t), exerciseIds: t.exerciseIds.map(remap) });
  }
  merged.workouts.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  restampPBFlags(merged.workouts);
  return merged;
}
