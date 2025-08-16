// /src/utils/fishStorage.ts

import { v4 as uuidv4 } from 'uuid';

// Define the structure of a saved fish
export interface SavedFish {
  id: string;             // Unique ID for the saved fish
  name: string;           // User-given name (optional)
  saveDate: string;       // When the fish was saved
  fishData: any;          // Serialized fish data
  thumbnail?: string;     // Base64 encoded thumbnail (optional)
  species: string;        // Fish species/type
  rarity?: string;        // Rarity/quality
  generation?: number;    // Generation number
}

// Key for local storage
const STORAGE_KEY = 'caroles_reef_saved_fish';

/**
 * Save a fish to local storage
 */
export function saveFish(fishData: any, name: string = ''): SavedFish | null {
  try {
    // Get existing saved fish
    const savedFish = getSavedFish();
    
    // Create a new saved fish object
    const savedFishItem: SavedFish = {
      id: uuidv4(),
      name: name || `Fish ${savedFish.length + 1}`,
      saveDate: new Date().toISOString(),
      fishData: JSON.parse(JSON.stringify(fishData)), // Deep clone to avoid reference issues
      species: fishData.species || 'unknown',
      rarity: fishData.rarity,
      generation: fishData.generation
    };
    
    // Add to saved fish
    savedFish.push(savedFishItem);
    
    // Save back to local storage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedFish));
    
    return savedFishItem;
  } catch (error) {
    console.error('Error saving fish:', error);
    return null;
  }
}

/**
 * Get all saved fish from local storage
 */
export function getSavedFish(): SavedFish[] {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    return savedData ? JSON.parse(savedData) : [];
  } catch (error) {
    console.error('Error loading saved fish:', error);
    return [];
  }
}

/**
 * Remove a fish from saved storage
 */
export function removeSavedFish(fishId: string): boolean {
  try {
    const savedFish = getSavedFish();
    const newSavedFish = savedFish.filter(fish => fish.id !== fishId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSavedFish));
    return true;
  } catch (error) {
    console.error('Error removing fish:', error);
    return false;
  }
}

/**
 * Clear all saved fish
 */
export function clearAllSavedFish(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing saved fish:', error);
  }
}
