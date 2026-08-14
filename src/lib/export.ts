import type { AppState } from './types';

export function exportFilename(d: Date): string {
  return `workouts-${d.toISOString().slice(0, 10)}.json`;
}

export function downloadExport(state: AppState, now: Date = new Date()): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = exportFilename(now);
  a.click();
  URL.revokeObjectURL(url);
}
