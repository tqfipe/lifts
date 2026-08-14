import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SCHEMA_VERSION, emptyState } from './types';
import { _testReset, flushSave, isStorageAvailable, loadState, migrate, scheduleSave } from './storage';
import { toasts } from './toast.svelte';

beforeEach(async () => {
  await _testReset();
});

describe('loadState', () => {
  it('returns empty state when nothing is stored', async () => {
    expect(await loadState()).toEqual(emptyState());
  });

  it('round-trips a saved state', async () => {
    const s = emptyState();
    s.exercises.push({ id: 'ex1', name: 'Row' });
    s.workouts.push({
      id: 'w1',
      startedAt: '2026-01-01T12:00:00Z',
      finishedAt: '2026-01-01T13:00:00Z',
      entries: [{ exerciseId: 'ex1', weight: 70, logged: true, isPB: false }],
    });
    scheduleSave(s);
    await flushSave();
    expect(await loadState()).toEqual(s);
  });

  it('debounce collapses rapid saves to the latest state', async () => {
    const a = emptyState();
    a.exercises.push({ id: 'a', name: 'A' });
    const b = emptyState();
    b.exercises.push({ id: 'b', name: 'B' });
    scheduleSave(a);
    scheduleSave(b);
    await flushSave();
    expect((await loadState()).exercises).toEqual([{ id: 'b', name: 'B' }]);
  });
});

describe('write failures', () => {
  it('does not latch storage unavailable, and a later save still succeeds', async () => {
    const putSpy = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementationOnce(() => {
      throw new Error('simulated write failure');
    });
    const a = emptyState();
    a.exercises.push({ id: 'a', name: 'A' });
    scheduleSave(a);
    await flushSave();
    expect(isStorageAvailable()).toBe(true);
    putSpy.mockRestore();

    const b = emptyState();
    b.exercises.push({ id: 'b', name: 'B' });
    scheduleSave(b);
    await flushSave();
    expect((await loadState()).exercises).toEqual([{ id: 'b', name: 'B' }]);
  });

  it('rate-limits the failure toast so a run of failures does not spam it', async () => {
    const putSpy = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(() => {
      throw new Error('simulated write failure');
    });
    const before = toasts.length;
    scheduleSave(emptyState());
    await flushSave();
    scheduleSave(emptyState());
    await flushSave();
    expect(toasts.length).toBe(before + 1);
    putSpy.mockRestore();
  });
});

describe('migrate', () => {
  it('passes through current-version states', () => {
    const s = emptyState();
    expect(migrate(s)).toEqual(s);
  });

  it('returns empty state for junk', () => {
    expect(migrate(null)).toEqual(emptyState());
    expect(migrate('nope')).toEqual(emptyState());
    expect(migrate({ hello: 1 })).toEqual(emptyState());
  });
});
