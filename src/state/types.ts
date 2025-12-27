// /src/state/types.ts

import type { Creature } from '../entities/creature';
export type Mode = 'food' | 'decor';
export interface AppState {
  time: number;
  paused: boolean;
  mode: Mode;
  generation: number;
  discovered: Set<string>;
  theme: 'day' | 'dusk' | 'night';
  creatures: Creature[];
  pellets: { id: string; x: number; y: number; vy: number; r: number }[];
  decors: { id: string; type: string; x: number; y: number; r: number; size: 's' | 'm' | 'l' }[];
}

export const DECOR_TYPES = ['plant', 'coral', 'rock', 'chest'] as const;
export type DecorKind = (typeof DECOR_TYPES)[number];

export const DECOR_SIZES = ['s', 'm', 'l'] as const;
export type DecorSize = (typeof DECOR_SIZES)[number];

export type Decor = {
  id: string;
  type: DecorKind;
  x: number;
  y: number;
  r: number;
  size: DecorSize;
};
