import { describe, expect, it } from 'vitest';
import { buildImportPrompt } from './llmPrompt';

describe('buildImportPrompt', () => {
  it('documents the simple format and the conversion rules', () => {
    const p = buildImportPrompt();
    expect(p).toContain('"format": "simple-v1"');
    expect(p).toContain('kg');
    expect(p).toContain('22,5');
    expect(p).toContain('date range');
  });

  it('contains a valid JSON example', () => {
    const p = buildImportPrompt();
    const match = p.match(/```json\n([\s\S]*?)\n```/);
    expect(match).not.toBeNull();
    expect(() => JSON.parse(match![1])).not.toThrow();
  });
});
