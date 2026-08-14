import { describe, expect, it } from 'vitest';
import { parseRoute } from './router';

describe('parseRoute', () => {
  it('parses all routes', () => {
    expect(parseRoute('')).toEqual({ name: 'home' });
    expect(parseRoute('#/')).toEqual({ name: 'home' });
    expect(parseRoute('#/workout/abc123')).toEqual({ name: 'workout', id: 'abc123' });
    expect(parseRoute('#/history')).toEqual({ name: 'history' });
    expect(parseRoute('#/stats')).toEqual({ name: 'stats' });
    expect(parseRoute('#/settings')).toEqual({ name: 'settings' });
    expect(parseRoute('#/about')).toEqual({ name: 'about' });
  });

  it('falls back to home for junk and incomplete routes', () => {
    expect(parseRoute('#/workout')).toEqual({ name: 'home' });
    expect(parseRoute('#/bogus/whatever')).toEqual({ name: 'home' });
  });
});
