import type { EventBus } from '../core/events';
import type { AppState } from '../state/types';

import { drawBackground } from './background';
import { drawFish } from './creatureRenderers/fishRenderer';
export function drawFrame(
  state: AppState,
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  _bus: EventBus
) {
  drawBackground(ctx, w, h, state.theme);
  for (const c of state.creatures) {
    if (c.species === 'fish') drawFish(ctx, c);
  }
}
