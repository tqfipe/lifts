import { describe, expect, it } from 'vitest';
import { CATALOG, GLYPHS, commonNotIn, iconForName } from './exerciseCatalog';

describe('CATALOG', () => {
  it('seeds a useful set of common exercises with valid icons', () => {
    expect(CATALOG.length).toBeGreaterThanOrEqual(18);
    for (const entry of CATALOG) expect(GLYPHS[entry.icon]).toBeDefined();
  });

  it('has no duplicate names (normalized)', () => {
    const names = CATALOG.map((c) => c.name.trim().toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('iconForName', () => {
  it('matches catalog entries exactly, case- and whitespace-insensitive', () => {
    expect(iconForName('Leg press')).toBe('sled');
    expect(iconForName('  hack   SQUAT ')).toBe('sled');
    expect(iconForName('rdl')).toBe('barbell');
    expect(iconForName('Lat pulldown')).toBe('pulldown');
    expect(iconForName('Hamstring curl')).toBe('leg-machine');
  });

  it('falls back to keyword matching for unknown names', () => {
    expect(iconForName('Cable row wide grip')).toBe('cable-row');
    expect(iconForName('Bulgarian split squat')).toBe('rack');
    expect(iconForName('Seated shoulder press')).toBe('dumbbell');
    expect(iconForName('Spider curl')).toBe('curl');
    expect(iconForName('Standing calf press')).toBe('calf');
  });

  it('defaults to the generic weight glyph', () => {
    expect(iconForName('Farmer walk')).toBe('weight');
    expect(iconForName('')).toBe('weight');
  });
});

describe('commonNotIn', () => {
  it('filters out catalog entries the user already has, by normalized name', () => {
    const existing = [
      { id: 'a', name: 'leg  PRESS' },
      { id: 'b', name: 'Row' },
    ];
    const left = commonNotIn(existing);
    expect(left.some((c) => c.name === 'Leg press')).toBe(false);
    expect(left.some((c) => c.name === 'Row')).toBe(false);
    expect(left.some((c) => c.name === 'Hack squat')).toBe(true);
  });
});
