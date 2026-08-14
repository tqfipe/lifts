import { describe, expect, it } from 'vitest';
import { dragWeight, snapWeight, tickMarks } from './rulerMath';

describe('snapWeight', () => {
  it('snaps to the nearest step', () => {
    expect(snapWeight(63.7, 2.5)).toBe(62.5);
    expect(snapWeight(63.8, 2.5)).toBe(65);
    expect(snapWeight(70, 2.5)).toBe(70);
  });

  it('never goes below zero', () => {
    expect(snapWeight(-3, 2.5)).toBe(0);
  });

  it('avoids float dust', () => {
    expect(snapWeight(0.1 + 0.2, 0.5)).toBe(0.5);
  });
});

describe('dragWeight', () => {
  it('dragging left increases, right decreases, floored at 0', () => {
    expect(dragWeight(50, 100, 40, 12)).toBe(55);
    expect(dragWeight(50, 100, 160, 12)).toBe(45);
    expect(dragWeight(2, 0, 1000, 12)).toBe(0);
  });
});

describe('tickMarks', () => {
  it('spans the range in step increments with majors at multiples of 10', () => {
    const ticks = tickMarks(60, 5, 2.5);
    expect(ticks.map((t) => t.weight)).toEqual([55, 57.5, 60, 62.5, 65]);
    expect(ticks.filter((t) => t.major).map((t) => t.weight)).toEqual([60]);
  });

  it('never emits negative ticks', () => {
    expect(tickMarks(2.5, 10, 2.5)[0].weight).toBe(0);
  });
});
