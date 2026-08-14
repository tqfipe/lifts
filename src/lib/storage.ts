import { SCHEMA_VERSION, emptyState, type AppState } from './types';

const DB_NAME = 'workout-tracker';
const STORE = 'app';
const KEY = 'state';
const SAVE_DELAY_MS = 300;

let dbPromise: Promise<IDBDatabase> | null = null;
let available = true;
let pending: ReturnType<typeof setTimeout> | undefined;
let lastState: AppState | null = null;

export function isStorageAvailable(): boolean {
  return available;
}

function openDb(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export function migrate(raw: unknown): AppState {
  if (typeof raw !== 'object' || raw === null) return emptyState();
  const obj = raw as Partial<AppState>;
  if (obj.schemaVersion === SCHEMA_VERSION) return obj as AppState;
  // Future schema bumps: add stepwise migrations keyed on obj.schemaVersion here.
  return emptyState();
}

export async function loadState(): Promise<AppState> {
  try {
    const db = await openDb();
    const raw = await new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    if (raw == null) return emptyState();
    return migrate(raw);
  } catch {
    available = false;
    return emptyState();
  }
}

export function scheduleSave(state: AppState): void {
  lastState = state;
  clearTimeout(pending);
  pending = setTimeout(() => void writeNow(), SAVE_DELAY_MS);
}

export async function flushSave(): Promise<void> {
  clearTimeout(pending);
  await writeNow();
}

async function writeNow(): Promise<void> {
  if (!lastState || !available) return;
  try {
    const db = await openDb();
    const state = lastState;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(state, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    available = false;
  }
}

export async function _testReset(): Promise<void> {
  if (dbPromise) (await dbPromise).close();
  dbPromise = null;
  lastState = null;
  available = true;
  clearTimeout(pending);
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = req.onerror = req.onblocked = () => resolve();
  });
}
