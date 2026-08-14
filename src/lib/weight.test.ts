import { describe, expect, it } from 'vitest';
import { formatWeight, fromDisplay, parseWeight, toDisplay } from './weight';

describe('unit conversion', () => {
  it('kg display is identity', () => {
    expect(toDisplay(62.5, 'kg')).toBe(62.5);
    expect(fromDisplay(62.5, 'kg')).toBe(62.5);
  });

  it('converts kg to lb with 1-decimal display rounding', () => {
    expect(toDisplay(60, 'lb')).toBe(132.3);
    expect(toDisplay(100, 'lb')).toBe(220.5);
  });

  it('converts entered lb back to kg', () => {
    expect(fromDisplay(135, 'lb')).toBeCloseTo(61.235, 3);
  });

  it('round-trips typical lb values exactly', () => {
    for (const lb of [45, 95, 135, 225, 315, 2.5]) {
      expect(toDisplay(fromDisplay(lb, 'lb'), 'lb')).toBe(lb);
    }
  });
});

describe('parseWeight', () => {
  it('parses plain and decimal numbers', () => {
    expect(parseWeight('60')).toBe(60);
    expect(parseWeight('62.5')).toBe(62.5);
  });

  it('accepts decimal comma', () => {
    expect(parseWeight('22,5')).toBe(22.5);
  });

  it('trims whitespace', () => {
    expect(parseWeight('  70 ')).toBe(70);
  });

  it('rejects garbage, negatives, and empty input', () => {
    expect(parseWeight('heavy')).toBeNull();
    expect(parseWeight('12kg')).toBeNull();
    expect(parseWeight('-5')).toBeNull();
    expect(parseWeight('')).toBeNull();
    expect(parseWeight('1,2,3')).toBeNull();
  });
});

describe('formatWeight', () => {
  it('formats integers bare and decimals with comma', () => {
    expect(formatWeight(60)).toBe('60');
    expect(formatWeight(22.5)).toBe('22,5');
  });
});
