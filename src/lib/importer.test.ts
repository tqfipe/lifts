import { describe, expect, it } from 'vitest';
import { emptyState } from './types';
import { mergeStates, parseImport } from './importer';

const simple = JSON.stringify({
  format: 'simple-v1',
  workouts: [
    {
      date: '2026-01-01',
      entries: [{ exercise: 'Row', weight: 55 }],
    },
    {
      date: '2026-01-08',
      note: 'good session',
      entries: [
        { exercise: 'row', weight: 70, reps: 8, note: 'PB attempt' },
        { exercise: 'RDL', weight: 60, sets: [{ weight: 50, reps: 10 }, { weight: 60, reps: 6 }] },
      ],
    },
  ],
});

describe('parseImport — simple format', () => {
  it('converts to a full state with deduped exercises and restamped PBs', () => {
    const r = parseImport(simple);
    if (!r.ok) throw new Error(r.error);
    expect(r.data.exercises.map((e) => e.name)).toEqual(['Row', 'RDL']);
    expect(r.data.workouts).toHaveLength(2);
    expect(r.data.workouts[0].finishedAt).toBeDefined();
    const rowId = r.data.exercises[0].id;
    const secondRow = r.data.workouts[1].entries.find((e) => e.exerciseId === rowId)!;
    expect(secondRow).toMatchObject({ weight: 70, reps: 8, note: 'PB attempt', isPB: true, logged: true });
    expect(r.preview).toEqual({ workouts: 2, exercises: 2, from: '2026-01-01', to: '2026-01-08' });
  });

  it('names the failing path on bad data', () => {
    const bad = JSON.stringify({
      format: 'simple-v1',
      workouts: [{ date: '2026-01-01', entries: [{ exercise: 'Row', weight: 'heavy' }] }],
    });
    const r = parseImport(bad);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('workouts[0].entries[0].weight');
  });

  it('rejects invalid JSON and unknown shapes', () => {
    expect(parseImport('not json').ok).toBe(false);
    expect(parseImport('{"hello": 1}').ok).toBe(false);
  });
});

describe('parseImport — full backup', () => {
  it('accepts a round-tripped state', () => {
    const s = emptyState();
    s.exercises.push({ id: 'row', name: 'Row' });
    s.workouts.push({
      id: 'w1',
      startedAt: '2026-01-01T12:00:00.000Z',
      finishedAt: '2026-01-01T12:00:00.000Z',
      entries: [{ exerciseId: 'row', weight: 70, logged: true, isPB: false }],
    });
    const r = parseImport(JSON.stringify(s));
    if (!r.ok) throw new Error(r.error);
    expect(r.data.workouts).toHaveLength(1);
  });

  it('rejects wrong schema versions', () => {
    const r = parseImport(JSON.stringify({ ...emptyState(), schemaVersion: 99 }));
    expect(r.ok).toBe(false);
  });
});

describe('mergeStates', () => {
  it('remaps incoming exercises onto existing ones by name and dedupes workouts by id', () => {
    const current = emptyState();
    current.exercises.push({ id: 'cur-row', name: 'Row' });
    current.workouts.push({
      id: 'w1',
      startedAt: '2026-01-01T12:00:00Z',
      finishedAt: '2026-01-01T12:00:00Z',
      entries: [{ exerciseId: 'cur-row', weight: 55, logged: true, isPB: false }],
    });
    const incoming = emptyState();
    incoming.exercises.push({ id: 'inc-row', name: 'row' }, { id: 'inc-rdl', name: 'RDL' });
    incoming.workouts.push(
      {
        id: 'w1', // duplicate id — skipped
        startedAt: '2026-01-01T12:00:00Z',
        finishedAt: '2026-01-01T12:00:00Z',
        entries: [{ exerciseId: 'inc-row', weight: 99, logged: true, isPB: false }],
      },
      {
        id: 'w2',
        startedAt: '2026-01-08T12:00:00Z',
        finishedAt: '2026-01-08T12:00:00Z',
        entries: [{ exerciseId: 'inc-row', weight: 70, logged: true, isPB: false }],
      },
    );
    const merged = mergeStates(current, incoming);
    expect(merged.exercises.map((e) => e.id).sort()).toEqual(['cur-row', 'inc-rdl']);
    expect(merged.workouts).toHaveLength(2);
    const w2 = merged.workouts.find((w) => w.id === 'w2')!;
    expect(w2.entries[0].exerciseId).toBe('cur-row');
    expect(w2.entries[0].isPB).toBe(true); // 70 beats 55 chronologically
  });
});
