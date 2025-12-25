// /src/utils/fishStorage.ts

import { v4 as uuidv4 } from 'uuid';
import { gameState } from '../state/GameState';

/**
 * Define the structure of a saved fish.
 *
 * @interface SavedFish
 * @property {string} id - Unique ID for the saved fish.
 * @property {string} name - User-given name.
 * @property {string} saveDate - When the fish was saved (ISO string).
 * @property {any} fishData - Serialized fish data.
 * @property {string} [thumbnail] - Base64 encoded thumbnail (optional).
 * @property {string} species - Fish species/type.
 * @property {string} [rarity] - Rarity/quality (optional).
 * @property {number} [generation] - Generation number (optional).
 * @property {number} timestamp - Timestamp for sorting/versioning.
 */
export interface SavedFish {
  id: string;
  name: string;
  saveDate: string;
  fishData: any;
  thumbnail?: string;
  species: string;
  rarity?: string;
  generation?: number;
  timestamp: number;
}

// Type for fish data as stored in LocalStorageManager
interface StoredFish {
  id: string;
  fishData: any;
  timestamp: number;
  name?: string;
  saveDate?: string;
  species?: string;
  rarity?: string;
  generation?: number;
  thumbnail?: string;
}

// We now use the centralized LocalStorageManager for all storage operations
// The old STORAGE_KEY constant has been removed in favor of the storage manager

/**
 * Saves a fish to local storage.
 *
 * @param {any} fishData - The fish data to save.
 * @param {string} [name=''] - The name of the fish (optional).
 * @returns {SavedFish | null} - The saved fish object, or null if an error occurred.
 */
export function saveFish(fishData: any, name: string = ''): SavedFish | null {
  try {
    const currentState = gameState.getState();
    const fishCollection = currentState.fishCollection || [];
    
    // Create a new saved fish object
    const now = Date.now();
    const savedFishItem: SavedFish = {
      id: uuidv4(),
      name: name || `Fish ${fishCollection.length + 1}`,
      saveDate: new Date(now).toISOString(),
      fishData: JSON.parse(JSON.stringify(fishData)), // Deep clone to avoid reference issues
      species: fishData.species || 'unknown',
      rarity: fishData.rarity,
      generation: fishData.generation,
      timestamp: now
    };
    
    // Add to fish collection
    const updatedCollection = [...fishCollection, {
      ...savedFishItem,
      // Ensure we have all required fields for the storage format
      timestamp: savedFishItem.timestamp || Date.now()
    }];
    
    gameState.updateState({ fishCollection: updatedCollection });
    
    return savedFishItem;
  } catch (error) {
    console.error('Error saving fish:', error);
    return null;
  }
}

/**
 * Get all saved fish from local storage
 *
 * @returns {SavedFish[]} - Array of saved fish objects
 * @throws {Error} - If an error occurs while loading saved fish
 */
export function getSavedFish(): SavedFish[] {
  try {
    const collection = (gameState.getState().fishCollection || []) as StoredFish[];

    // Convert stored fish format to SavedFish format
    return collection.map(fish => {
      // Use the fishData directly since we don't need to modify it
      const fishData = fish.fishData;
      const timestamp = fish.timestamp || Date.now();
      const saveDate = fish.saveDate || new Date(timestamp).toISOString();
      const name = fish.name || `Fish ${fish.id.slice(0, 5)}`;
      const species = fish.species || fishData.species || 'unknown';

      return {
        id: fish.id,
        name,
        saveDate,
        fishData,
        species,
        rarity: fish.rarity,
        generation: fish.generation,
        thumbnail: fish.thumbnail,
        timestamp
      };
    });
  } catch (error) {
    console.error('Error loading saved fish:', error);
    throw new Error('Error loading saved fish');
  }
}

/**
 * Remove a fish from saved storage
 *
 * @param {string} fishId - The ID of the fish to remove
 * @returns {boolean} - True if the fish was successfully removed, false otherwise
 */
export function removeSavedFish(fishId: string): boolean {
  try {
    const currentState = gameState.getState();
    const updatedCollection = (currentState.fishCollection || []).filter((fish: { id: string }) => fish.id !== fishId);
    gameState.updateState({ fishCollection: updatedCollection });
    
    return true;
  } catch (error) {
    console.error('Error removing fish:', error);
    return false;
  }
}

/**
 * Clear all saved fish
 *
 * @returns {void}
 */
export function clearAllSavedFish(): void {
  try {
    gameState.updateState({ fishCollection: [] });
  } catch (error) {
    console.error('Error clearing saved fish:', error);
  }
}
