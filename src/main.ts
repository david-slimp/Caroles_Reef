// src/main.ts
import { AudioManager } from './audio/audioManager';
import { EventBus } from './core/events';
import { runLegacyGame } from './legacy/runLegacyGame';
import { gameState } from './state/GameState';
import { storageManager } from './utils/localStorageManager';

// Initialize core systems
const bus = new EventBus();
const _audio = new AudioManager(bus);

// Load saved data and initialize game state
try {
  const savedData = storageManager.load();
  gameState.load(savedData);
} catch (error) {
  console.error('Failed to load saved data:', error);
  // Continue with default state
}

// Start the game with proper async initialization
async function initGame() {
  try {
    // Start the legacy game (it owns rAF, canvas, inputs, UI)
    await runLegacyGame('c');
    
    // Start background music after user interaction
    // The actual playback is now handled by the audio system after user interaction
    // and respects the mute state set by the user
    
    // Optional: expose for quick debugging
    // @ts-expect-error - debug only
    window.__GAME__ = { bus, _audio };
  } catch (error) {
    console.error('Failed to initialize game:', error);
    // Show error to user in a more user-friendly way
    const errorEl = document.createElement('div');
    errorEl.style.position = 'fixed';
    errorEl.style.top = '0';
    errorEl.style.left = '0';
    errorEl.style.right = '0';
    errorEl.style.padding = '1rem';
    errorEl.style.backgroundColor = '#ffebee';
    errorEl.style.color = '#b71c1c';
    errorEl.style.zIndex = '1000';
    errorEl.textContent = 'Error initializing game. Please refresh the page or contact support if the problem persists.';
    document.body.prepend(errorEl);
  }
}

// Start the game
initGame();
