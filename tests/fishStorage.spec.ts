import { describe, expect, it } from 'vitest';

import { gameState } from '../src/state/GameState';
import { clearAllSavedFish, getSavedFish, saveFish } from '../src/utils/fishStorage';

describe('fishStorage', () => {
  it('saves fish data into game state and returns it on read', () => {
    gameState.updateState({ fishCollection: [] });

    const saved = saveFish({ species: 'tester', generation: 2 }, 'Specimen');
    expect(saved).not.toBeNull();

    const all = getSavedFish();
    expect(all.length).toBe(1);
    expect(all[0].name).toBe('Specimen');
    expect(all[0].species).toBe('tester');

    clearAllSavedFish();
  });
});
