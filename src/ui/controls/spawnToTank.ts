/**
 * @module SpawnToTank
 * @description Handles the UI and logic for spawning biological entities from the player's
 * inventory into the active tank environment. This is a temporary implementation that currently
 * works with fish data but is designed to be expanded to support a wider variety of biological
 * "bios" (entities) in the future.
 */

import { FishCollection as BioInventory } from '../FishCollection';
import { toast } from '../toast';

/**
 * Configuration options for the SpawnToTank button
 */
export interface SpawnToTankConfig {
  /**
   * The target DOM element where the button will be rendered
   */
  container: HTMLElement;
  
  /**
   * Callback triggered when a bio creature is successfully spawned
   * @param bioData - The data of the spawned bio
   */
  onSpawn?: (bioData: any) => void;
  
  /**
   * Callback for handling any errors during the spawn process
   * @param error - The error that occurred
   * @param bioData - The bio data that failed to spawn (if available)
   */
  onError?: (error: Error, bioData?: any) => void;
}

/**
 * Handles the UI and logic for spawning the bio creatures into the tank
 */
export class SpawnToTankButton {
  private button: HTMLButtonElement;
  private bioInv: BioInventory;
  private config: SpawnToTankConfig;
  private isInitialized: boolean = false;

  /**
   * Creates a new SpawnToTankButton instance
   * @param config - Configuration options for the button
   */
  constructor(config: SpawnToTankConfig) {
    this.config = config;
    this.bioInv = new BioInventory();
    this.button = document.createElement('button');
    this.initialize();
  }

  /**
   * Initializes the button and sets up event listeners
   * @private
   */
  private initialize(): void {
    if (this.isInitialized) return;

    this.button.className = 'btn-spawn-to-tank';
    this.button.textContent = 'Spawn to Tank';
    this.button.title = 'Add a bio from your inventory to the tank';
    
    this.button.addEventListener('click', this.handleClick.bind(this));
    this.config.container.appendChild(this.button);
    
    this.isInitialized = true;
  }

  /**
   * Handles the button click event
   * @private
   */
  private async handleClick(): Promise<void> {
    try {
      // Show the bio inventory UI (show fish collection right now)
      this.bioInv.show(async (bioData: any) => {
        try {
          // TODO: Replace with proper bio spawning logic
          // This is a temporary implementation that assumes legacy fish data
          await this.spawnBio(bioData);
          
          if (this.config.onSpawn) {
            this.config.onSpawn(bioData);
          }
          
          toast('Bio added to tank!');
        } catch (error) {
          this.handleSpawnError(error as Error, bioData);
        }
      });
    } catch (error) {
      this.handleSpawnError(error as Error);
    }
  }

  /**
   * Spawns a bio into the tank
   * @param bioData - The data of the bio to spawn
   * @private
   */
  private async spawnBio(bioData: any): Promise<void> {
    // TODO: Implement actual bio spawning logic
    // This is a placeholder that will be replaced with proper entity management
    console.debug('Spawning bio:', bioData);
    
    // Temporary implementation - will be updated to use the game's entity system
    if (window.fishCollection && typeof window.fishCollection.spawnFishFromData === 'function') {
      await window.fishCollection.spawnFishFromData(bioData);
    } else {
      throw new Error('Bio spawning system not available');
    }
  }

  /**
   * Handles errors that occur during the spawn process
   * @param error - The error that occurred
   * @param bioData - The bio data that failed to spawn (if available)
   * @private
   */
  private handleSpawnError(error: Error, bioData?: any): void {
    console.error('Error spawning bio:', error, bioData);
    
    if (this.config.onError) {
      this.config.onError(error, bioData);
    }
    
    toast('Failed to add bio to tank', true);
  }

  /**
   * Enables the spawn to tank button
   */
  public enable(): void {
    this.button.disabled = false;
  }

  /**
   * Disables the spawn to tank button
   */
  public disable(): void {
    this.button.disabled = true;
  }

  /**
   * Destroys the button and cleans up event listeners
   */
  public destroy(): void {
    if (this.button.parentNode) {
      this.button.removeEventListener('click', this.handleClick);
      this.button.remove();
    }
    this.isInitialized = false;
  }
}

/**
 * Creates and returns a new SpawnToTankButton instance
 * @param config - Configuration options for the button
 * @returns A new SpawnToTankButton instance
 */
export function createSpawnToTankButton(config: SpawnToTankConfig): SpawnToTankButton {
  return new SpawnToTankButton(config);
}
