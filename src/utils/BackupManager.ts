import { fishManager } from '../creatures/FishManager';
import { gameState } from '../state/GameState';

import gameDataValidator from './gameDataValidator';
import { storageManager, GameSaveData } from './localStorageManager';

interface RestoreOptions {
  file: File;
  preserveTankFish?: boolean;
}

interface FishData {
  id: string;
  originalId?: string;
  name?: string;
  species?: string;
  lastSaved?: number;
  timestamp?: number;
  saveDate?: string;
  generation?: string;
  thumbnail?: string;
  fishData?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Manages backup and restore operations for game data
 */
class BackupManager {
  private static instance: BackupManager;

  private constructor() {}

  /**
   * Validates and cleans a fish collection
   * @param fishCollection The fish collection to validate
   * @returns Validated fish collection or null if validation fails
   */
  private validateFishCollection(fishCollection: unknown): FishData[] | null {
    if (!Array.isArray(fishCollection)) {
      console.error('Fish collection is not an array');
      return null;
    }

    const result: FishData[] = [];

    fishCollection.forEach(fish => {
      const validated = gameDataValidator.validateAndTransformFishCollectionItem(
        fish,
        Math.floor(Date.now() / 1000)
      );
      if (validated) {
        result.push(validated as FishData);
      } else {
        console.warn('Invalid fish data found in collection, skipping');
      }
    });

    return result.length > 0 ? result : null;
  }

  public static getInstance(): BackupManager {
    if (!BackupManager.instance) {
      BackupManager.instance = new BackupManager();
    }
    return BackupManager.instance;
  }

  /**
   * Creates a backup of all game data including fish collection and settings
   * @returns {string} JSON string containing all game data
   */
  public createBackup(): string {
    try {
      // Get current game state
      // We need to set gameState = to the current game state from GameState.ts using the prper method given in there ....  not from storageManager
      const currentGameState = gameState.getState();

      // Get the current in-memory bio (fish) Inventory
      const bioInventory = fishManager.getSavedFish();
      const normalizedCollection =
        this.validateFishCollection(currentGameState.fishCollection || bioInventory) || [];
      const normalizedBioInventory = this.validateFishCollection(bioInventory) || [];

      // Create backup object with game state and bio (fish) Inventory
      const backupData = {
        ...currentGameState,
        // Ensure we don't include any functions or circular references
        fish: [], // Fish are handled separately in fishCollection
        fishCollection: normalizedCollection,
        bioInventory: normalizedBioInventory.map(fish => ({
          ...fish,
          // Ensure fish data is serializable
          fishData: {
            ...fish.fishData,
            // Remove any non-serializable properties
            onSelect: undefined,
            onRemove: undefined,
          },
        })),
      };

      return JSON.stringify(backupData, null, 2);
    } catch (error) {
      console.error('Error creating backup:', error);
      throw new Error(`Failed to create backup: ${(error as Error).message}`);
    }
  }

  /**
   * Restores game data from a backup
   * @param {string} backupData JSON string containing backup data
   * @param {boolean} preserveTankFish Whether to preserve fish currently in the tank
   * @returns {Promise<boolean>} True if restore was successful
   */
  public async restoreBackup(
    backupData: string,
    preserveTankFish: boolean = true
  ): Promise<boolean> {
    console.log('Starting restoreBackup with preserveTankFish:', preserveTankFish);

    // Get current tank fish before doing anything else
    let currentTankFish: FishData[] = [];
    if (
      preserveTankFish &&
      typeof window !== 'undefined' &&
      (window as { fish?: FishData[] }).fish
    ) {
      console.log('Preserving current tank fish...');
      // Create a deep copy of current fish to avoid reference issues
      currentTankFish = JSON.parse(JSON.stringify((window as { fish?: FishData[] }).fish || []));
      console.log(`Found ${currentTankFish.length} fish to preserve`);

      // Generate new IDs for current tank fish to avoid conflicts
      currentTankFish.forEach(fish => {
        const newId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        fish.originalId = fish.id; // Store original ID
        fish.id = newId; // Assign new temporary ID
      });
    } else {
      console.log('Not preserving current tank fish');
    }

    try {
      // Parse and validate backup data
      const backup = JSON.parse(backupData);

      if (!backup || typeof backup !== 'object') {
        throw new Error('Invalid backup format');
      }

      // Check backup version
      if (backup.version !== '1.0.0') {
        throw new Error(`Unsupported backup version: ${backup.version}`);
      }

      // Validate required data
      if (!backup.gameState || typeof backup.gameState !== 'object') {
        throw new Error('Invalid game state in backup');
      }

      if (!Array.isArray(backup.fishCollection)) {
        throw new Error('Invalid fish collection in backup');
      }

      // Update the game data with the backup
      console.log('Restoring game state and fish collection...');
      const currentData: GameSaveData = { ...storageManager.getCurrentData() };

      // Create a deep copy of the backup data to avoid modifying the original
      const backupCopy = JSON.parse(JSON.stringify(backup));

      // Ensure fishCollection exists and is an array
      if (!Array.isArray(backupCopy.fishCollection)) {
        backupCopy.fishCollection = [];
      }

      // Update the in-memory data with backup data
      const updatedData: GameSaveData = {
        ...currentData,
        ...(backupCopy.gameState as Partial<GameSaveData>),
        fishCollection: backupCopy.fishCollection,
        inventoryPresets: Array.isArray(backupCopy.inventoryPresets)
          ? backupCopy.inventoryPresets
          : currentData.inventoryPresets,
        selectedInventoryPresetId:
          typeof backupCopy.selectedInventoryPresetId === 'string'
            ? backupCopy.selectedInventoryPresetId
            : currentData.selectedInventoryPresetId,
        lastSaved: Date.now(),
      };

      console.log(`Restoring ${updatedData.fishCollection.length} fish from backup`);

      // Validate the fish collection before saving
      const validatedFishCollection = this.validateFishCollection(updatedData.fishCollection);
      if (!validatedFishCollection) {
        throw new Error('Failed to validate fish collection from backup');
      }

      // Update the data with validated collection
      updatedData.fishCollection = validatedFishCollection;

      // Ensure fish array is populated for backward compatibility
      if (Array.isArray(updatedData.fishCollection) && !Array.isArray(updatedData.fish)) {
        updatedData.fish = updatedData.fishCollection.map((item: FishData) => ({
          id: item.id,
          name: item.fishData?.name || 'Unknown Fish',
          species: item.fishData?.species || 'unknown',
        }));
      }

      // Log the data we're about to save
      console.log('Data to be saved:', {
        fishCount: updatedData.fish?.length || 0,
        fishCollectionCount: updatedData.fishCollection?.length || 0,
        hasFishArray: Array.isArray(updatedData.fish),
        hasFishCollection: Array.isArray(updatedData.fishCollection),
      });

      if (updatedData.fishCollection && updatedData.fishCollection.length > 0) {
        console.log('Sample fish from backup:', {
          id: updatedData.fishCollection[0].id,
          name: updatedData.fishCollection[0].fishData?.name,
          species: updatedData.fishCollection[0].fishData?.species,
        });
      }

      // Save the updated data through storageManager (async to avoid blocking)
      console.log('Saving validated backup data to storage...');
      const saveSuccess = await new Promise<boolean>(resolve => {
        // Use setTimeout to ensure this runs in the next tick
        setTimeout(() => {
          try {
            const result = storageManager.save(updatedData);
            console.log('Storage save result:', result);
            resolve(result);
          } catch (e) {
            console.error('Error saving to storage:', e);
            resolve(false);
          }
        }, 0);
      });

      if (!saveSuccess) {
        throw new Error('Failed to save validated backup data to storage');
      }

      // Sync GameState with restored data so UI reflects the backup immediately
      try {
        gameState.load(updatedData);
      } catch (error) {
        console.error('Failed to sync GameState after backup restore:', error);
      }

      // Update the global state without triggering a page reload
      if (typeof window !== 'undefined') {
        const win = window as {
          fishCollection?: FishData[];
          fish?: Array<Record<string, unknown> & { id?: string; originalId?: string }>;
          tankFishIds?: Set<string>;
        };

        console.log('Global state before update:', {
          hasFishCollection: Array.isArray(win.fishCollection),
          hasFishArray: Array.isArray(win.fish),
          currentFishCount: win.fish?.length || 0,
          currentCollectionCount: win.fishCollection?.length || 0,
        });

        // Update fish collection if it exists
        if (Array.isArray(updatedData.fishCollection)) {
          console.log('Updating in-memory fish collection...');
          win.fishCollection = [...updatedData.fishCollection];
          console.log(`Updated fish collection with ${win.fishCollection.length} fish`);

          // Ensure the fish array is in sync
          if (!win.fish) win.fish = [];
          win.fish = updatedData.fishCollection.map((item: FishData) => ({
            id: item.id,
            name: item.fishData?.name || 'Unknown',
            species: item.fishData?.species || 'unknown',
            ...item.fishData,
          }));
          console.log(`Updated fish array with ${win.fish.length} fish`);
        }

        // Add back the preserved tank fish
        if (currentTankFish.length > 0) {
          console.log(`Adding back ${currentTankFish.length} preserved fish to the tank...`);
          win.fish.push(...currentTankFish);
          console.log(`Total fish after adding preserved fish: ${win.fish.length}`);
        }

        // Reinitialize FishManager to ensure it has the latest data
        try {
          // Clear existing fish collection
          fishManager.clearAllFish();

          // Add all fish from the backup to FishManager
          if (Array.isArray(updatedData.fishCollection)) {
            updatedData.fishCollection.forEach((fish: FishData) => {
              try {
                fishManager.saveFish(fish.fishData || fish);
              } catch (error) {
                console.error('Error adding fish to FishManager during restore:', error);
              }
            });
          }

          console.log(
            `FishManager updated with ${updatedData.fishCollection?.length || 0} fish from backup`
          );
        } catch (e) {
          console.error('Failed to reinitialize FishManager after backup restore:', e);
        }

        // Notify components about the update
        const event = new CustomEvent('backupRestored', {
          detail: {
            fishCount: win.fish?.length || 0,
            collectionCount: win.fishCollection?.length || 0,
          },
        });
        window.dispatchEvent(event);
      }

      console.log('Game state restored and validated successfully');

      // Add back the current tank fish after restore
      if (currentTankFish.length > 0 && typeof window !== 'undefined') {
        console.log(`Adding back ${currentTankFish.length} preserved fish to the tank...`);
        try {
          const fishArray = (window as { fish?: FishData[]; tankFishIds?: Set<string> }).fish || [];
          console.log(
            `Current fish array length before adding preserved fish: ${fishArray.length}`
          );

          currentTankFish.forEach(fish => {
            fishArray.push(fish);

            // Update tankFishIds if it exists
            if ((window as { tankFishIds?: Set<string> }).tankFishIds) {
              (window as { tankFishIds?: Set<string> }).tankFishIds?.add(
                fish.originalId || fish.id
              );
            }
          });

          console.log(
            `Restored ${currentTankFish.length} fish to the tank. New fish array length: ${fishArray.length}`
          );
        } catch (error) {
          console.error('Error restoring tank fish after backup:', error);
        }
      } else {
        console.log('No fish to restore or window is not defined');
      }

      return true;
    } catch (error) {
      console.error('Error restoring backup:', error);
      throw new Error(`Failed to restore backup: ${(error as Error).message}`);
    }
  }

  /**
   * Formats a date as YYYYMMDD_HHMMSS
   * @param {Date} date - The date to format
   * @returns {string} Formatted date string
   */
  private formatDateForFilename(date: Date): string {
    const pad = (num: number) => num.toString().padStart(2, '0');
    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate()),
      '_',
      pad(date.getHours()),
      pad(date.getMinutes()),
      pad(date.getSeconds()),
    ].join('');
  }

  /**
   * Downloads the backup as a file
   * @param {string} [tag] - Optional tag to include in the filename
   */
  public downloadBackup(tag?: string): void {
    try {
      const backupData = this.createBackup();
      const blob = new Blob([backupData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Build filename with optional tag
      const tagSuffix = tag ? `_${tag}` : '';
      a.download = `caroles_reef_backup_${this.formatDateForFilename(new Date())}${tagSuffix}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading backup:', error);
      throw new Error('Failed to download backup');
    }
  }

  /**
   * Handles backup file upload
   * @param options Options for the restore operation
   * @param options.file File object to restore from
   * @param options.preserveTankFish Whether to preserve fish currently in the tank (default: true)
   * @returns {Promise<boolean>} True if restore was successful
   */
  public async handleFileUpload(options: RestoreOptions): Promise<boolean> {
    const { file, preserveTankFish = true } = options;
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async event => {
        try {
          if (!event.target?.result) {
            throw new Error('Failed to read file');
          }

          console.log('Starting backup restore...');
          const result = await this.restoreBackup(event.target.result as string, preserveTankFish);

          resolve(result);
        } catch (error) {
          console.error('Error during backup restore:', error);
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Error reading backup file'));
      };

      reader.readAsText(file);
    });
  }
}

export const backupManager = BackupManager.getInstance();
