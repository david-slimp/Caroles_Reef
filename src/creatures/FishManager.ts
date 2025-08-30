
import { storageManager } from '../utils/localStorageManager';
import gameDataValidator from '../utils/gameDataValidator';

type FishData = any; // Temporary type until we have the actual type

interface SavedFish {
  id: string;
  fishData: FishData;
  timestamp: number;
}

/**
 * Manager for fish data.
 * This class is a singleton and should be accessed using the static method getInstance().
 */
class FishManager {
/** Singleton instance of the FishManager. */
private static instance: FishManager;

/** In-memory collection of saved fish. */
private fishCollection: SavedFish[] = [];

/** Tracks if the FishManager has been initialized. */
private isInitialized = false;

/** Private constructor to enforce singleton pattern. */
private constructor() {}

  /**
   * Get the singleton instance of the FishManager.
   * @returns {FishManager} The singleton instance.
   */
  public static getInstance(): FishManager {
    if (!FishManager.instance) {
      FishManager.instance = new FishManager();
    }
    return FishManager.instance;
  }

  /**
   * Initialize the fish manager by loading data from localStorage
   * Should be called once during app initialization
   * @returns {Promise<void>} Resolves when initialization is complete
   * @description This function loads saved fish data from localStorage and initializes the in-memory collection of fish.
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load from localStorage via storageManager
      const savedData = storageManager.load();
      this.fishCollection = Array.isArray(savedData.fishCollection) 
        ? savedData.fishCollection 
        : [];
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize FishManager:', error);
      this.fishCollection = [];
    }
  }

  /**
   * Get all fish from in-memory collection
   * @returns {SavedFish[]} Array of fish objects in memory
   * @description This function only reads from in-memory data and does not access localStorage
   */
  public getSavedFish(): SavedFish[] {
    if (!this.isInitialized) {
      console.warn('FishManager not initialized. Call initialize() first.');
      return [];
    }
    return [...this.fishCollection];
  }

  /**
   * Get a fish by ID from in-memory collection
   * @param {string} id - The ID of the fish to retrieve
   * @returns {SavedFish|undefined} The fish object if found, undefined otherwise
   * @description This function only reads from in-memory data and does not access localStorage
   */
  public getFishById(id: string): SavedFish | undefined {
    if (!this.isInitialized) {
      console.warn('FishManager not initialized. Call initialize() first.');
      return undefined;
    }
    return this.fishCollection.find(fish => fish.id === id || fish.fishData.id === id);
  }

  /**
   * Clear all fish from the in-memory collection
   * This does not affect storage - only clears the in-memory cache.
   * @returns {void}
   */
  public clearAllFish(): void {
    if (!this.isInitialized) {
      console.warn('FishManager not initialized. Call initialize() first.');
      return;
    }
    console.log('Clearing all fish from FishManager');
    this.fishCollection = [];
  }

  /**
   * Add or update a fish in the in-memory collection
   * @param {FishData} fishData - The fish data to save
   * @description This function only updates in-memory data. Persistence to storage
   * should be handled separately by the storage manager's save cycle.
   */
  public saveFish(fishData: FishData): void {
    if (!this.isInitialized) {
      throw new Error('FishManager not initialized. Call initialize() first.');
    }

    const validatedFish = gameDataValidator.validateAndTransformFish(fishData, Math.floor(Date.now() / 1000));
    if (!validatedFish) {
      throw new Error('Invalid fish data');
    }

    const existingIndex = this.fishCollection.findIndex(f => 
      f.id === validatedFish.id || f.fishData.id === validatedFish.id
    );

    const fishToSave: SavedFish = {
      id: validatedFish.id || `fish-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fishData: validatedFish,
      timestamp: Date.now()
    };

    if (existingIndex >= 0) {
      this.fishCollection[existingIndex] = fishToSave;
    } else {
      this.fishCollection.push(fishToSave);
    }
  }

  /**
   * Remove a fish by ID
   * @param {string} id - The ID of the fish to remove
   * @returns {boolean} True if the fish was removed, false otherwise
   */
  public removeFishById(id: string): boolean {
    if (!this.isInitialized) {
      console.warn('FishManager not initialized. Call initialize() first.');
      return false;
    }

    const initialLength = this.fishCollection.length;
    this.fishCollection = this.fishCollection.filter(
      fish => fish.id !== id && fish.fishData.id !== id
    );
    return this.fishCollection.length < initialLength;
  }

  /**
   * Get the current fish collection for persistence
   * @returns {SavedFish[]} A deep copy of the in-memory fish collection
   * @description This function provides a read-only copy of the in-memory data.
   * It should only be used by the storage manager during persistence operations.
   */
  public getFishForPersistence(): SavedFish[] {
    return [...this.fishCollection];
  }
}

const fishManager = FishManager.getInstance();

export { fishManager };
