import { describe, expect, it } from 'vitest';
import { newId } from './id';

describe('newId', () => {
  it('makes 12-char lowercase alphanumeric ids', () => {
    for (let i = 0; i < 50; i++) expect(newId()).toMatch(/^[a-z0-9]{12}$/);
  });

  it('does not collide in practice', () => {
    const ids = new Set(Array.from({ length: 1000 }, newId));
    expect(ids.size).toBe(1000);
  });
});
