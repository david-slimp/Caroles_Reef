import { describe, expect, it } from 'vitest';

import { gameState } from '../src/state/GameState';

describe('GameState', () => {
  it('tracks fishCollection updates and preserves ids', () => {
    gameState.updateState({ fishCollection: [] });

    gameState.updateState({
      fishCollection: [
        {
          id: 'fish-1',
          timestamp: Date.now(),
          fishData: { id: 'fish-1' },
        },
      ],
    });

    const state = gameState.getState();
    expect(state.fishCollection.length).toBe(1);
    expect(state.fishCollection[0].id).toBe('fish-1');
  });
});
