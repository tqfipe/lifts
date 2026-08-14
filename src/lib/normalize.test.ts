import { describe, expect, it } from 'vitest';
import { cleanName, findExerciseByName, normalizeName } from './normalize';

describe('normalizeName', () => {
  it('lowercases, trims, and collapses whitespace', () => {
    expect(normalizeName('  Leg   Press ')).toBe('leg press');
    expect(normalizeName('RDL')).toBe('rdl');
  });
});

describe('cleanName', () => {
  it('trims and collapses whitespace but keeps casing', () => {
    expect(cleanName('  Leg   Press ')).toBe('Leg Press');
  });
});

describe('findExerciseByName', () => {
  const exercises = [
    { id: 'a', name: 'Leg press' },
    { id: 'b', name: 'RDL' },
  ];

  it('matches case-insensitively with stray whitespace', () => {
    expect(findExerciseByName(exercises, 'leg  PRESS ')?.id).toBe('a');
    expect(findExerciseByName(exercises, 'Rdl')?.id).toBe('b');
  });

  it('returns undefined for unknown names', () => {
    expect(findExerciseByName(exercises, 'Hack squat')).toBeUndefined();
  });
});
