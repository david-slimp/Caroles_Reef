import { describe, expect, it } from 'vitest';

import { BACKGROUNDS, DEFAULT_BACKGROUND } from '../src/config/backgrounds';

describe('backgrounds config', () => {
  it('includes the default background id', () => {
    expect(DEFAULT_BACKGROUND in BACKGROUNDS).toBe(true);
  });

  it('defines background entries with matching types', () => {
    expect(BACKGROUNDS.gradient.type).toBe('gradient');
    expect(BACKGROUNDS['coral-reef'].type).toBe('coral-reef');
    expect(BACKGROUNDS['custom-image'].type).toBe('custom-image');
    expect(BACKGROUNDS.future.type).toBe('future');
  });

  it('defines gradient stops as numeric color pairs', () => {
    const stops = BACKGROUNDS.gradient.stops ?? [];
    expect(stops.length).toBeGreaterThan(0);
    stops.forEach(([pos, color]) => {
      expect(typeof pos).toBe('number');
      expect(typeof color).toBe('string');
    });
  });
});
