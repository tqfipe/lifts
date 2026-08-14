import { describe, expect, it } from 'vitest';
import { dragTargetIndex } from './reorder';

describe('dragTargetIndex', () => {
  it('maps drag distance to row offsets', () => {
    expect(dragTargetIndex(2, 0, 60, 5)).toBe(2);
    expect(dragTargetIndex(2, 65, 60, 5)).toBe(3);
    expect(dragTargetIndex(2, -130, 60, 5)).toBe(0);
  });

  it('clamps to list bounds', () => {
    expect(dragTargetIndex(0, -500, 60, 5)).toBe(0);
    expect(dragTargetIndex(4, 500, 60, 5)).toBe(4);
  });
});
