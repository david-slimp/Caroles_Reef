import { Howl } from 'howler';

import type { EventBus } from '../core/events';

import { SFX } from './sfx';
export class AudioManager {
  constructor(bus: EventBus) {
    bus.on('ui:click', () => this.play('click'));
    bus.on('fish:ate', () => this.play('eat'));
  }
  play(id: keyof typeof SFX) {
    new Howl({ src: [SFX[id]] }).play();
  }
}
