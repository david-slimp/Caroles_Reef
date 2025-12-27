import { describe, expect, it } from 'vitest';

import { fishManager } from '../src/creatures/FishManager';

describe('FishManager', () => {
  it('saves validated fish data and returns it', async () => {
    await fishManager.initialize();
    fishManager.clearAllFish();

    fishManager.saveFish({});

    const saved = fishManager.getSavedFish();
    expect(saved.length).toBe(1);
    expect(typeof saved[0].id).toBe('string');
    expect(saved[0].id.length).toBeGreaterThan(0);
    expect(typeof saved[0].fishData).toBe('object');
  });
});
