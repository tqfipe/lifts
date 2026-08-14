import { describe, expect, it } from 'vitest';
import type { Entry, Workout } from './types';
import {
  computePBs,
  entryMaxWeight,
  predictWeight,
  restampPBFlags,
  sortExercisesForPicker,
} from './derive';

function entry(exerciseId: string, weight: number, extra: Partial<Entry> = {}): Entry {
  return { exerciseId, weight, logged: true, isPB: false, ...extra };
}

function workout(id: string, date: string, entries: Entry[], finished = true): Workout {
  return { id, startedAt: date, ...(finished ? { finishedAt: date } : {}), entries };
}

describe('entryMaxWeight', () => {
  it('uses headline weight without sets', () => {
    expect(entryMaxWeight(entry('a', 60))).toBe(60);
  });

  it('considers set weights too', () => {
    expect(entryMaxWeight(entry('a', 60, { sets: [{ weight: 55 }, { weight: 65 }] }))).toBe(65);
  });
});

describe('computePBs', () => {
  it('finds the best weight per exercise with the earliest date it was hit', () => {
    const pbs = computePBs([
      workout('w1', '2026-01-01T12:00:00Z', [entry('row', 55)]),
      workout('w2', '2026-01-08T12:00:00Z', [entry('row', 70)]),
      workout('w3', '2026-01-15T12:00:00Z', [entry('row', 70)]),
    ]);
    expect(pbs.get('row')).toEqual({ weight: 70, date: '2026-01-08T12:00:00Z' });
  });

  it('ignores unfinished workouts', () => {
    const pbs = computePBs([workout('w1', '2026-01-01T12:00:00Z', [entry('row', 99)], false)]);
    expect(pbs.get('row')).toBeUndefined();
  });

  it('counts set weights', () => {
    const pbs = computePBs([
      workout('w1', '2026-01-01T12:00:00Z', [entry('row', 60, { sets: [{ weight: 72.5 }] })]),
    ]);
    expect(pbs.get('row')?.weight).toBe(72.5);
  });
});

describe('predictWeight', () => {
  const history = [
    workout('w1', '2026-01-01T12:00:00Z', [entry('row', 55)]),
    workout('w2', '2026-01-08T12:00:00Z', [entry('row', 65)]),
    workout('w3', '2026-01-15T12:00:00Z', [entry('press', 70)]),
    workout('w4', '2026-01-20T12:00:00Z', [entry('row', 99)], false),
  ];

  it('returns the most recent finished headline weight', () => {
    expect(predictWeight(history, 'row')).toBe(65);
  });

  it('returns null for unknown exercises', () => {
    expect(predictWeight(history, 'squat')).toBeNull();
  });
});

describe('sortExercisesForPicker', () => {
  it('sorts by recency, then frequency, then name', () => {
    const exercises = [
      { id: 'old-frequent', name: 'B old frequent' },
      { id: 'recent', name: 'C recent' },
      { id: 'old-rare', name: 'A old rare' },
      { id: 'never', name: 'D never used' },
    ];
    const workouts = [
      workout('w1', '2026-01-01T12:00:00Z', [entry('old-frequent', 50), entry('old-rare', 20)]),
      workout('w2', '2026-01-02T12:00:00Z', [entry('old-frequent', 50)]),
      workout('w3', '2026-01-10T12:00:00Z', [entry('recent', 60)]),
    ];
    expect(sortExercisesForPicker(exercises, workouts).map((e) => e.id)).toEqual([
      'recent',
      'old-frequent',
      'old-rare',
      'never',
    ]);
  });
});

describe('restampPBFlags', () => {
  it('marks only strict improvements after the first log', () => {
    const workouts = [
      workout('w1', '2026-01-01T12:00:00Z', [entry('row', 55)]),
      workout('w2', '2026-01-08T12:00:00Z', [entry('row', 70)]),
      workout('w3', '2026-01-15T12:00:00Z', [entry('row', 70)]),
      workout('w4', '2026-01-22T12:00:00Z', [entry('row', 72.5)]),
    ];
    restampPBFlags(workouts);
    expect(workouts.map((w) => w.entries[0].isPB)).toEqual([false, true, false, true]);
  });

  it('handles out-of-order input by sorting on date', () => {
    const workouts = [
      workout('w2', '2026-01-08T12:00:00Z', [entry('row', 70)]),
      workout('w1', '2026-01-01T12:00:00Z', [entry('row', 55)]),
    ];
    restampPBFlags(workouts);
    expect(workouts.find((w) => w.id === 'w2')?.entries[0].isPB).toBe(true);
    expect(workouts.find((w) => w.id === 'w1')?.entries[0].isPB).toBe(false);
  });
});
