import { describe, expect, it } from 'vitest';
import { SCHEMA_VERSION, emptyState } from './types';

describe('emptyState', () => {
  it('creates a versioned empty state with default settings', () => {
    const s = emptyState();
    expect(s.schemaVersion).toBe(SCHEMA_VERSION);
    expect(s.exercises).toEqual([]);
    expect(s.workouts).toEqual([]);
    expect(s.templates).toEqual([]);
    expect(s.settings).toEqual({ weightStep: 2.5 });
  });

  it('returns a fresh object every call', () => {
    expect(emptyState()).not.toBe(emptyState());
    const a = emptyState();
    a.workouts.push({ id: 'x', startedAt: 'now', entries: [] });
    expect(emptyState().workouts).toEqual([]);
  });
});
