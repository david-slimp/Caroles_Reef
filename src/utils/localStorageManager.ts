import { DEFAULT_SAVE_DATA, validateAndTransformGameData } from './gameDataValidator';

/**
 * Represents the complete game state that gets persisted to localStorage.
 * This interface defines the structure of all game data that will be saved and loaded.
 * 
 * @property {string} version - The version of the game data format, used for migration
 * @property {number} lastSaved - Timestamp of when the game was last saved (milliseconds since epoch)
 * @property {Object} gameState - Current game state information
 * @property {number} gameState.gameTime - Total play time in seconds
 * @property {string} gameState.currentScene - Identifier of the current game scene
 * @property {number} gameState.score - Player's current score
 * @property {Object} settings - User preferences and settings
 * @property {number} settings.volume - Master volume level (0.0 to 1.0)
 * @property {boolean} settings.sfxMuted - Whether sound effects are muted
 * @property {boolean} settings.musicMuted - Whether music is muted
 * @property {string} settings.musicTrack - Currently playing music track
 * @property {string} settings.theme - Current UI theme identifier
 * @property {number} settings.uiScale - UI scaling factor
 * @property {Array<Object>} fish - Collection of fish in the aquarium
 * @property {string} fish[].id - Unique identifier for the fish
 * @property {string} fish[].name - Display name of the fish
 * @property {string} fish[].species - Species identifier of the fish
 * @property {Object} tank - Tank/aquarium state
 * @property {string} tank.background - Current background identifier
 * @property {Array<Object>} tank.decorations - Placed tank decorations
 * @property {string} tank.decorations[].id - Unique identifier for the decoration
 * @property {string} tank.decorations[].type - Type identifier of the decoration
 * @property {number} tank.decorations[].x - X coordinate position
 * @property {number} tank.decorations[].y - Y coordinate position
 * @property {number} tank.decorations[].rotation - Rotation in degrees
 * @property {Object} progress - Player progress and unlocks
 * @property {string[]} progress.unlocked - List of unlocked item/achievement IDs
 * @property {Record<string, boolean>} progress.flags - Game progress flags and states
 */
export interface GameSaveData {
  /** Game version for save compatibility */
  version: string;
  /** When this game was last saved */
  lastSaved: number;
  
  // Game state
  gameState: {
    /** Current game time or play session */
    gameTime: number;
    /** Current scene or level */
    currentScene: string;
    /** Player's score or points */
    score: number;
  };

  // Player settings
  settings: {
    /** Audio volume (0-1) */
    volume: number;
    /** Whether sound effects are muted */
    sfxMuted: boolean;
    /** Whether music is muted */
    musicMuted: boolean;
    /** Current music track */
    musicTrack: string;
    /** Visual theme */
    theme: string;
    /** UI scaling */
    uiScale: number;
  };

  // Fish collection (legacy, kept for backward compatibility)
  fish: Array<{
    id: string;
    name: string;
    species: string;
  }>;

  // New fish collection format
  fishCollection?: Array<{
    id: string;
    fishData: any;
    timestamp: number;
  }>;

  // Tank state
  tank: {
    /** Current background */
    background: string;
    /** Placed decorations */
    decorations: Array<{
      id: string;
      type: string;
      x: number;
      y: number;
      rotation: number;
    }>;
  };

  // Player progress
  progress: {
    /** Unlocked items/achievements */
    unlocked: string[];
    /** Game progress flags */
    flags: Record<string, boolean>;
  };
}

/** Storage key for game data */
const STORAGE_KEY = 'caroles_reef_save_data';


/**
 * Centralized localStorage management for the game.
 * This singleton class handles all interactions with the browser's localStorage,
 * providing a clean API for saving and loading game state.
 * 
 * @example
 * // Getting the singleton instance
 * const storage = LocalStorageManager.getInstance();
 * 
 * // Loading game data
 * const gameData = storage.getCurrentData();
 * 
 * // Saving game data
 * storage.save(updatedGameData);
 * 
 * // Resetting to defaults
 * storage.resetToDefaults();
 */
class LocalStorageManager {
  private static instance: LocalStorageManager;
  private currentData: GameSaveData;

  /**
   * Private constructor for the singleton pattern.
   * Initializes the manager by loading existing data or creating a new save file.
   * @private
   */
  private constructor() {
    this.currentData = this.load();
  }

  
  /**
   * Gets the singleton instance of the LocalStorageManager.
   * Creates a new instance if one doesn't exist.
   * 
   * @returns {LocalStorageManager} The singleton instance
   * @static
   */
  public static getInstance(): LocalStorageManager {
    if (!LocalStorageManager.instance) {
      LocalStorageManager.instance = new LocalStorageManager();
    }
    return LocalStorageManager.instance;
  }


  /**
   * Loads game data from localStorage.
   * If no saved data exists or if there's an error, returns default data.
   * 
   * @returns {GameSaveData} The loaded or default game data
   * @throws Will log errors to console but will always return a valid GameSaveData
   */
  public load(): GameSaveData {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      console.log('[Storage] Loaded saved data from localStorage:', savedData);
      
      let result: GameSaveData;
      if (!savedData) {
        console.log('[Storage] No saved data found, using defaults');
        result = this.deepClone(DEFAULT_SAVE_DATA);
      } else {
        try {
          // Parse and validate the saved data
          const parsedData = JSON.parse(savedData);
          result = validateAndTransformGameData<GameSaveData>(parsedData);
          
          // Ensure we have a valid fish collection
          if (!Array.isArray(result.fishCollection) && Array.isArray(result.fish)) {
            // Migrate from old fish array to fishCollection
            result.fishCollection = result.fish.map((fish: any) => ({
              id: fish.id || `fish-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              fishData: fish,
              timestamp: Date.now()
            }));
            console.log(`[Storage] Migrated ${result.fishCollection.length} fish from legacy format`);
          } else if (!Array.isArray(result.fishCollection)) {
            result.fishCollection = [];
          }
          
          console.log(`[Storage] Loaded game state with ${result.fishCollection?.length || 0} fish`);
        } catch (e) {
          console.warn('[Storage] Error parsing saved data, using defaults', e);
          result = this.deepClone(DEFAULT_SAVE_DATA);
        }
      }
      
      // Update the current data cache
      this.currentData = result;
      return result;
    } catch (error) {
      console.error('Error loading game data:', error);
      return { ...DEFAULT_SAVE_DATA };
    }
  }


  /**
   * Saves the current game state to localStorage.
   * Updates the lastSaved timestamp before saving.
   * 
   * @param {GameSaveData} data - The complete game state to save
   * @returns {boolean} True if save was successful, false otherwise
   * @throws Will log errors to console if saving fails
   * 
   * @deprecated Use saveAsync for better error handling with Promises
   * Keep the synchronous save method for backward compatibility
   */
  public save(data: GameSaveData): boolean {
    try {
      // Validate and transform the data before saving
      const validatedData = validateAndTransformGameData<GameSaveData>({
        ...data,
        lastSaved: Date.now()
      });
      
      // Update the current data cache
      this.currentData = this.deepClone(validatedData);
      
      // Ensure we don't save circular references
      const serializableData = this.prepareForSerialization(validatedData);
      
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializableData));
      
      console.log(`[Storage] Game state saved at ${new Date().toISOString()}`);
      return true;
    } catch (error) {
      console.error('Error saving game data:', error);
      return false;
    }
  }
  
  /**
   * Asynchronously saves the current game state to localStorage.
   * Updates the lastSaved timestamp before saving.
   * 
   * @param {GameSaveData} data - The complete game state to save
   * @returns {Promise<boolean>} A promise that resolves to true if save was successful, false otherwise
   * @throws Will log errors to console if saving fails
   */
  public async saveAsync(data: GameSaveData): Promise<boolean> {
    try {
      // Validate and transform the data before saving
      const validatedData = validateAndTransformGameData<GameSaveData>({
        ...data,
        lastSaved: Date.now()
      });
      
      // Update the current data cache
      this.currentData = this.deepClone(validatedData);
      
      // Ensure we don't save circular references
      const serializableData = this.prepareForSerialization(validatedData);
      
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializableData));
      
      console.log('[Storage] Game state saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving game data asynchronously:', error);
      return false;
    }
  }

  /**
   * Creates a deep clone of the current game data.
   * Uses JSON parse/stringify for simplicity and to ensure a complete deep copy.
   * For more complex objects, consider using a library like lodash's cloneDeep.
   * 
   * @private
   * @template T
   * @param {T} obj - The object to clone
   * @returns {T} A deep clone of the object
   */
  /**
   * Prepares an object for serialization by removing circular references
   * and ensuring all data is JSON-serializable
   */
  private prepareForSerialization<T>(obj: T): T {
    const seen = new WeakSet();
    
    const replacer = (_: string, value: any) => {
      // Handle circular references
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      
      // Convert any non-serializable values to strings
      if (value instanceof Error) {
        return { message: value.message, stack: value.stack };
      } else if (value instanceof Map) {
        return Array.from(value.entries());
      } else if (value instanceof Set) {
        return Array.from(value);
      } else if (value instanceof Date) {
        return value.toISOString();
      } else if (value && typeof value === 'object' && 'toJSON' in value) {
        return value.toJSON();
      }
      
      return value;
    };
    
    return JSON.parse(JSON.stringify(obj, replacer));
  }

  /**
   * Creates a deep clone of an object using JSON parse/stringify
   */
  private deepClone<T>(obj: T): T {
    try {
      return JSON.parse(JSON.stringify(obj, (_, value) => {
        // Handle special cases for non-serializable values
        if (value instanceof Map) {
          return { __type: 'Map', value: Array.from(value.entries()) };
        } else if (value instanceof Set) {
          return { __type: 'Set', value: Array.from(value) };
        } else if (value instanceof Date) {
          return { __type: 'Date', value: value.toISOString() };
        }
        return value;
      }));
    } catch (error) {
      console.error('Error cloning object:', error);
      // Fallback to shallow clone if deep clone fails
      return { ...obj as any } as T;
    }
  }

  /**
   * Gets a deep, read-only copy of the current game data.
   * Prevents modification of the internal state, including nested objects.
   * 
   * @returns {Readonly<GameSaveData>} An immutable deep copy of the current game data
   */
  public getCurrentData(): Readonly<GameSaveData> {
    return this.deepClone(this.currentData);
  }


  /**
   * Exports the current game data as a JSON string.
   * Useful for save file exports or debugging.
   * 
   * @returns {string} A formatted JSON string of the current game data
   */
  public exportData(): string {
    return JSON.stringify(this.currentData, null, 2);
  }


  /**
   * Imports game data from a JSON string.
   * Validates and transforms the imported data before applying it.
   * 
   * @param {string} jsonString - JSON string containing the game data to import
   * @returns {boolean} True if import was successful, false otherwise
   * @throws Will log errors to console if the import fails
   */
  public importData(jsonString: string): boolean {
    try {
      const importedData = JSON.parse(jsonString);
      const validatedData = validateAndTransformGameData<GameSaveData>(importedData);
      this.currentData = validatedData;
      return this.save(validatedData);
    } catch (error) {
      console.error('Error importing game data:', error);
      return false;
    }
  }


  /**
   * Resets all game data to default values.
   * Useful for new game functionality or error recovery.
   * 
   * @returns {boolean} True if reset was successful, false otherwise
   */
  public resetToDefaults(): boolean {
    this.currentData = validateAndTransformGameData<GameSaveData>({ ...DEFAULT_SAVE_DATA });
    return this.save(this.currentData);
  }


}

// Export a singleton instance
export const storageManager = LocalStorageManager.getInstance();

// The GameSaveData interface is already exported at the top of the file
