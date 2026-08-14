import type { Entry, Exercise, Workout } from './types';

export function entryMaxWeight(entry: Entry): number {
  let max = entry.weight;
  for (const s of entry.sets ?? []) if (s.weight > max) max = s.weight;
  return max;
}

export interface PBRecord {
  weight: number;
  date: string;
}

function finishedAsc(workouts: Workout[]): Workout[] {
  return workouts.filter((w) => w.finishedAt).sort((a, b) => a.startedAt.localeCompare(b.startedAt));
}

export function computePBs(workouts: Workout[]): Map<string, PBRecord> {
  const pbs = new Map<string, PBRecord>();
  for (const w of finishedAsc(workouts)) {
    for (const e of w.entries) {
      const max = entryMaxWeight(e);
      const cur = pbs.get(e.exerciseId);
      if (!cur || max > cur.weight) pbs.set(e.exerciseId, { weight: max, date: w.startedAt });
    }
  }
  return pbs;
}

export function predictWeight(workouts: Workout[], exerciseId: string): number | null {
  const finished = finishedAsc(workouts);
  for (let i = finished.length - 1; i >= 0; i--) {
    const e = finished[i].entries.find((x) => x.exerciseId === exerciseId);
    if (e) return e.weight;
  }
  return null;
}

export function sortExercisesForPicker(exercises: Exercise[], workouts: Workout[]): Exercise[] {
  const lastUsed = new Map<string, string>();
  const freq = new Map<string, number>();
  for (const w of workouts) {
    if (!w.finishedAt) continue;
    for (const e of w.entries) {
      freq.set(e.exerciseId, (freq.get(e.exerciseId) ?? 0) + 1);
      const prev = lastUsed.get(e.exerciseId);
      if (!prev || w.startedAt > prev) lastUsed.set(e.exerciseId, w.startedAt);
    }
  }
  return [...exercises].sort((a, b) => {
    const la = lastUsed.get(a.id) ?? '';
    const lb = lastUsed.get(b.id) ?? '';
    if (la !== lb) return lb.localeCompare(la);
    const fa = freq.get(a.id) ?? 0;
    const fb = freq.get(b.id) ?? 0;
    if (fa !== fb) return fb - fa;
    return a.name.localeCompare(b.name);
  });
}

export function restampPBFlags(workouts: Workout[]): void {
  const best = new Map<string, number>();
  for (const w of finishedAsc(workouts)) {
    for (const e of w.entries) {
      const max = entryMaxWeight(e);
      const prev = best.get(e.exerciseId);
      e.isPB = prev !== undefined && max > prev;
      if (prev === undefined || max > prev) best.set(e.exerciseId, max);
    }
  }
}
