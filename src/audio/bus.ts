/**
 * Represents the different audio buses available for volume control.
 * Each bus can have its volume controlled independently.
 * - 'master': Controls overall audio output
 * - 'music': Controls background music volume
 * - 'sfx': Controls sound effects volume
 */
export type BusName = 'master' | 'music' | 'sfx';

/**
 * AudioBus provides volume control for different audio channels.
 * It ensures volume levels stay within the valid range [0, 1].
 * 
 * @example
 * const musicBus = new AudioBus();
 * musicBus.setVolume(0.7);
 * const currentVolume = musicBus.getVolume(); // 0.7
 */
export class AudioBus {
  /** Current volume level, always between 0 and 1 */
  private v = 1;

  /**
   * Sets the volume for this audio bus.
   * @param {number} n - The volume level to set (0.0 to 1.0)
   * @returns {void}
   */
  setVolume(n: number): void {
    this.v = Math.max(0, Math.min(1, n));
  }

  /**
   * Gets the current volume level of this audio bus.
   * @returns {number} The current volume level (0.0 to 1.0)
   */
  getVolume(): number {
    return this.v;
  }
}
