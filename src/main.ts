// src/main.ts
import { AudioManager } from './audio/audioManager';
import { EventBus } from './core/events';
import { runLegacyGame } from './legacy/runLegacyGame';

// Initialize optional systems you want available to legacy code (e.g., audio via events)
const bus = new EventBus();
const _audio = new AudioManager(bus);

// Start the legacy game (it owns rAF, canvas, inputs, UI)
runLegacyGame('c');

// Start background music after user interaction
// The actual playback is now handled by the audio system after user interaction
// and respects the mute state set by the user

// Optional: expose for quick debugging
// @ts-expect-error - debug only
window.__GAME__ = { bus, _audio };
