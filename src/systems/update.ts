import type { EventBus } from '../core/events';
import type { AppState } from '../state/types';
export function update(state: AppState, dt: number, _bus: EventBus) {
  state.time += dt;
}
