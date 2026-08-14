import { describe, expect, it } from 'vitest';
import { exportFilename } from './export';

describe('exportFilename', () => {
  it('stamps the date', () => {
    expect(exportFilename(new Date('2026-08-14T10:00:00Z'))).toBe('workouts-2026-08-14.json');
  });
});
