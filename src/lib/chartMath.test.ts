import { describe, expect, it } from 'vitest';
import type { Workout } from './types';
import { linePath, nearestIndex, scaleSeries, workoutsPerWeek } from './chartMath';

describe('scaleSeries', () => {
  it('maps min/max to padded corners', () => {
    const s = scaleSeries(
      [
        { t: 0, w: 10 },
        { t: 100, w: 20 },
      ],
      { width: 320, height: 180, pad: 20 },
    );
    expect(s.points[0]).toEqual({ x: 20, y: 160 });
    expect(s.points[1]).toEqual({ x: 300, y: 20 });
  });

  it('centers degenerate domains', () => {
    const s = scaleSeries([{ t: 5, w: 70 }], { width: 320, height: 180, pad: 20 });
    expect(s.points[0]).toEqual({ x: 160, y: 90 });
  });

  it('extends the domain with extra values', () => {
    const s = scaleSeries(
      [
        { t: 0, w: 10 },
        { t: 100, w: 20 },
      ],
      { width: 320, height: 180, pad: 20, extra: [{ t: 0, w: 30 }] },
    );
    expect(s.y(30)).toBe(20);
    expect(s.y(20)).toBeGreaterThan(20);
  });
});

describe('linePath', () => {
  it('builds an M/L path with 1-decimal coordinates', () => {
    expect(
      linePath([
        { x: 20, y: 160.04 },
        { x: 300.951, y: 20 },
      ]),
    ).toBe('M20 160 L301 20');
  });

  it('is empty for no points', () => {
    expect(linePath([])).toBe('');
  });
});

describe('nearestIndex', () => {
  it('returns the index closest to x', () => {
    expect(nearestIndex([10, 50, 90], 55)).toBe(1);
    expect(nearestIndex([10, 50, 90], 75)).toBe(2);
    expect(nearestIndex([10, 50, 90], -20)).toBe(0);
    expect(nearestIndex([10, 50, 90], 500)).toBe(2);
  });

  it('prefers the first on ties', () => {
    expect(nearestIndex([10, 30], 20)).toBe(0);
  });

  it('returns -1 for an empty list', () => {
    expect(nearestIndex([], 5)).toBe(-1);
  });
});

describe('workoutsPerWeek', () => {
  function fw(id: string, date: string): Workout {
    return { id, startedAt: date, finishedAt: date, entries: [] };
  }

  it('buckets finished workouts into Monday-based weeks, oldest first', () => {
    // 2026-08-14 is a Friday; current week starts Monday 2026-08-10.
    const now = new Date('2026-08-14T10:00:00');
    const weeks = workoutsPerWeek(
      [
        fw('a', '2026-08-11T10:00:00'), // this week
        fw('b', '2026-08-12T10:00:00'), // this week
        fw('c', '2026-08-04T10:00:00'), // last week
        fw('d', '2026-07-01T10:00:00'), // outside 3-week window
      ],
      3,
      now,
    );
    expect(weeks.map((w) => w.count)).toEqual([0, 1, 2]);
    expect(weeks[2].label).toBe('10/8');
  });
});
