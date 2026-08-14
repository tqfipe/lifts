import { describe, expect, it } from 'vitest';
import { formatWeight, parseWeight } from './weight';

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
