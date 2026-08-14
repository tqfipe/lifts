import type { Exercise } from './types';

export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function cleanName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function findExerciseByName(exercises: Exercise[], name: string): Exercise | undefined {
  const n = normalizeName(name);
  return exercises.find((e) => normalizeName(e.name) === n);
}
