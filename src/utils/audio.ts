// Audio utilities for the game

type AudioChannel = 'music' | 'sfx';

interface AudioState {
  volume: number;
  muted: boolean;
}

// Audio state for different channels
const audioState: Record<AudioChannel, AudioState> = {
  music: { volume: 0.1, muted: false },  // 10% volume for music
  sfx: { volume: 0.8, muted: false }     // 80% volume for sound effects
};

let backgroundMusic: HTMLAudioElement | null = null;
let hasUserInteracted = false;
const BACKGROUND_MUSIC_FILE = 'caroles_reef_bkgd_music.mp3';

// Listen for user interaction to enable audio
const handleUserInteraction = () => {
  if (!hasUserInteracted) {
    hasUserInteracted = true;
    document.removeEventListener('userInteraction', handleUserInteraction);
    
    // Start background music if not muted
    if (!audioState.music.muted) {
      playBackgroundMusic();
    }
  }
};

document.addEventListener('userInteraction', handleUserInteraction);

interface AudioOptions {
  volume?: number;
  fadeOutDuration?: number;
}

/**
 * Toggle mute state for a specific audio channel
 * @param channel The audio channel to toggle ('music' or 'sfx')
 * @returns The new mute state (true if muted, false otherwise)
 */
export function toggleMute(channel: AudioChannel): boolean {
  audioState[channel].muted = !audioState[channel].muted;
  
  // Update background music if it's the music channel
  if (channel === 'music' && backgroundMusic) {
    backgroundMusic.muted = audioState.music.muted;
  }
  
  return audioState[channel].muted;
}

/**
 * Get mute state for a specific audio channel
 * @param channel The audio channel to check ('music' or 'sfx')
 * @returns true if the channel is muted, false otherwise
 */
export function isMuted(channel: AudioChannel): boolean {
  return audioState[channel].muted;
}

/**
 * Set volume for a specific audio channel
 * @param channel The audio channel to set volume for ('music' or 'sfx')
 * @param volume Volume level (0-1)
 */
export function setVolume(channel: AudioChannel, volume: number) {
  audioState[channel].volume = Math.max(0, Math.min(1, volume));
  
  // Update background music if it's the music channel
  if (channel === 'music' && backgroundMusic) {
    backgroundMusic.volume = audioState.music.volume;
  }
}

/**
 * Play a sound effect with optional fade out
 * @param url Path to the sound file (relative to public/audio)
 * @param options.volume Volume level (0-1)
 * @param options.fadeOutDuration Duration of fade out in milliseconds (0 for no fade)
 */
export function playSound(url: string, options: AudioOptions = {}) {
  if (audioState.sfx.muted || !hasUserInteracted) return null;
  
  try {
    const { volume = 0.5, fadeOutDuration = 0 } = options;
    // Use relative path that works in both dev and production
    const audio = new Audio(`./audio/${url}`);
    
    // Add error handling for audio loading
    audio.onerror = (e) => {
      console.error('Error loading audio:', url, e);
    };
    // Apply SFX volume (from options or default) and channel volume
    const sfxVolume = (options.volume !== undefined ? options.volume : 0.8) * audioState.sfx.volume;
    audio.volume = sfxVolume;
    
    if (fadeOutDuration > 0) {
      audio.addEventListener('loadedmetadata', () => {
        const fadeOutStart = (audio.duration * 1000) - fadeOutDuration;
        
        const fadeOut = () => {
          if (audio.currentTime * 1000 >= fadeOutStart) {
            const progress = (audio.currentTime * 1000 - fadeOutStart) / fadeOutDuration;
            audio.volume = Math.max(0, volume * (1 - progress));
          }
          
          if (audio.volume <= 0.01) {
            audio.pause();
            audio.removeEventListener('timeupdate', fadeOut);
          }
        };
        
        audio.addEventListener('timeupdate', fadeOut);
      }, { once: true });
    }
    
    audio.play().catch(e => console.warn('Audio playback failed:', e));
    return audio;
  } catch (e) {
    console.warn('Error playing sound:', e);
    return null;
  }
}

/**
 * Background Music Controls
 */

export function playBackgroundMusic() {
  if (!hasUserInteracted) return;
  
  // If music is muted, don't play
  if (audioState.music.muted) {
    if (backgroundMusic) backgroundMusic.pause();
    return;
  }
  
  // Create audio element if it doesn't exist
  if (!backgroundMusic) {
    backgroundMusic = new Audio(`./audio/${BACKGROUND_MUSIC_FILE}`);
    backgroundMusic.loop = true;
    backgroundMusic.volume = audioState.music.volume;
    backgroundMusic.muted = audioState.music.muted;
    
    backgroundMusic.onerror = (e) => {
      console.error('Error loading background music:', e);
    };
  }
  
  // Play and handle any autoplay restrictions
  const playPromise = backgroundMusic.play();
  if (playPromise !== undefined) {
    playPromise.catch(error => {
      console.log('Autoplay prevented:', error);
      // Show UI to let user know they need to interact to play music
    });
  }
}

export function pauseBackgroundMusic() {
  if (backgroundMusic) {
    backgroundMusic.pause();
  }
}

export function stopBackgroundMusic() {
  if (backgroundMusic) {
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
  }
}

export function setMusicVolume(volume: number) {
  if (backgroundMusic) {
    backgroundMusic.volume = Math.min(1, Math.max(0, volume));
  }
}

// Predefined sound effects
export const Sounds = {
  release: 'release.mp3',
  background: BACKGROUND_MUSIC_FILE
};
