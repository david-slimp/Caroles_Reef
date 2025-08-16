import type { AppState } from './types';
export function createStore(): AppState {
  return {
    time: 0,
    paused: false,
    mode: 'food',
    generation: 1,
    discovered: new Set(),
    theme: 'day',
    creatures: [],
    pellets: [],
    decors: [],
  };
}
