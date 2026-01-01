import { storageManager, type GameSaveData } from '../utils/localStorageManager';

/**
 * Represents a single fish in the player's collection
 */
export interface FishCollectionItem {
  /** Unique identifier for the fish */
  id: string;
  /** The fish data including position, state, etc. */
  fishData: FishData;
  /** When the fish was added to the collection */
  lastSaved: number;
}

/**
 * Helper type to make all properties of T mutable
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

/**
 * The complete game state including the fish collection
 */
export interface GameState extends Omit<GameSaveData, 'fish'> {
  /** The player's collection of fish */
  fishCollection: Mutable<FishCollectionItem>[];
}

type FishData = Record<string, unknown> & { id?: string };

/**
 * Manages the game state and notifies subscribers of changes
 */
export class GameStateManager {
  private static readonly DEBUG = false;
  private static instance: GameStateManager;
  private state: GameState;
  private subscribers: Array<(state: GameState) => void> = [];
  private isDirty = false;
  private isSaving = false;
  private lastSaveAt = 0;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly saveIntervalMs = 60000;
  private tankSnapshotProvider: (() => FishData[]) | null = null;

  private constructor() {
    // Initialize with default state that matches the GameState interface
    const defaultState: GameState = {
      version: '1.0.0',
      lastSaved: Date.now(),
      gameState: {
        gameTime: 0,
        currentScene: 'tank',
        score: 0,
      },
      settings: {
        volume: 1.0,
        sfxMuted: false,
        musicMuted: false,
        musicTrack: 'default',
        theme: 'light',
        uiScale: 1.0,
        paused: false,
        debugDecorRadius: false,
      },
      tank: {
        background: 'default',
        decorations: [],
      },
      progress: {
        unlocked: [],
        flags: {},
      },
      fishCollection: [],
      tankFish: [],
      fishInTank: [],
      fishInTankOriginalIds: [],
      inventoryPresets: [
        {
          id: 'preset-all',
          name: 'All',
          isDefault: true,
          filters: {},
          columnOrder: [],
          columnVisibility: {},
          sort: null,
        },
      ],
      selectedInventoryPresetId: 'preset-all',
    };

    this.state = defaultState;

    if (GameStateManager.DEBUG) {
      console.log('[GameState] Initialized with default state:', this.state);
    }
  }

  /**
   * Gets the singleton instance of GameStateManager
   */
  public static getInstance(): GameStateManager {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager();
    }
    return GameStateManager.instance;
  }

  /**
   * Gets the current game state
   */
  public getState(): GameState {
    return this.state;
  }

  /**
   * Updates the game state using the provided updater function or partial state
   * @param updater Either a function that receives the current state and returns a partial state, or a partial state object
   */
  public updateState(
    updater: ((state: GameState) => Partial<GameState>) | Partial<GameState>
  ): void {
    if (GameStateManager.DEBUG) {
      console.groupCollapsed('[GameState] Updating state');
    }

    try {
      const prevState = { ...this.state };

      // Create a deep clone of the state to detect changes
      const nextState = JSON.parse(JSON.stringify(this.state)) as GameState;

      // Apply updates to the cloned state
      let stateUpdate: Partial<GameState>;
      if (typeof updater === 'function') {
        stateUpdate = updater({ ...nextState });
      } else {
        stateUpdate = updater;
      }

      // Merge the updates into the next state
      Object.assign(nextState, stateUpdate);

      // Ensure fishCollection is always an array
      if (!Array.isArray(nextState.fishCollection)) {
        console.warn('[GameState] fishCollection was not an array, fixing...');
        nextState.fishCollection = [];
      }

      // Log the changes before updating the state
      if (GameStateManager.DEBUG) {
        console.log('State changes:', {
          prevFishCount: prevState.fishCollection?.length || 0,
          nextFishCount: nextState.fishCollection?.length || 0,
          prevFishIds: prevState.fishCollection?.map(f => f.id) || [],
          nextFishIds: nextState.fishCollection?.map(f => f.id) || [],
        });
      }

      // Update the state reference
      this.state = nextState;
      this.markDirty();

      // Notify subscribers
      this.notifySubscribers();

      if (GameStateManager.DEBUG) {
        console.log('[GameState] State updated and subscribers notified');
      }
    } catch (error) {
      console.error('[GameState] Error updating state:', error);
      throw error;
    } finally {
      if (GameStateManager.DEBUG) {
        console.groupEnd();
      }
    }
  }

  /**
   * Registers a provider for the current live tank snapshot.
   */
  public setTankSnapshotProvider(provider: (() => FishData[]) | null): void {
    this.tankSnapshotProvider = provider;
  }

  /**
   * Returns a snapshot of the live tank fish when available.
   */
  public getTankSnapshot(): FishData[] {
    const snapshot = this.tankSnapshotProvider ? this.tankSnapshotProvider() : this.state.tankFish;
    return Array.isArray(snapshot) ? snapshot : [];
  }

  /**
   * Subscribes to state changes
   * @param callback Function to call when state changes
   * @returns Unsubscribe function
   */
  public subscribe(callback: (state: GameState) => void): () => void {
    this.subscribers.push(callback);
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notifySubscribers() {
    if (this.subscribers.length > 0) {
      if (GameStateManager.DEBUG) {
        console.log(`[GameState] Notifying ${this.subscribers.length} subscribers`);
      }
      this.subscribers.forEach((callback, index) => {
        try {
          if (GameStateManager.DEBUG) {
            console.log(`[GameState] Notifying subscriber #${index + 1}`);
          }
          callback({ ...this.state });
        } catch (error) {
          console.error(`[GameState] Error in subscriber #${index + 1}:`, error);
        }
      });
    } else {
      if (GameStateManager.DEBUG) {
        console.warn('[GameState] No subscribers to notify');
      }
    }
  }

  // Persistence methods
  async save(): Promise<void> {
    try {
      if (this.saveTimer) {
        clearTimeout(this.saveTimer);
        this.saveTimer = null;
      }
      const tankFish = this.tankSnapshotProvider
        ? this.tankSnapshotProvider()
        : this.state.tankFish;
      const fishInTank = Array.isArray(this.state.fishInTank) ? this.state.fishInTank : [];
      const fishInTankOriginalIds = Array.isArray(this.state.fishInTankOriginalIds)
        ? this.state.fishInTankOriginalIds
        : [];

      // Convert to GameSaveData format
      const saveData: GameSaveData = {
        ...this.state,
        fish: this.state.fishCollection.map(({ fishData }) => fishData),
        tankFish: Array.isArray(tankFish) ? tankFish : [],
        fishInTank,
        fishInTankOriginalIds,
        lastSaved: Date.now(),
        version: this.state.version || '1.0.0',
      };

      storageManager.save(saveData);
      this.lastSaveAt = Date.now();
      this.isDirty = false;
    } catch (error) {
      console.error('Failed to save game state:', error);
      throw error;
    }
  }

  private markDirty(): void {
    this.isDirty = true;
    this.scheduleSave();
  }

  private scheduleSave(): void {
    if (this.saveTimer || this.isSaving) return;
    const elapsed = Date.now() - this.lastSaveAt;
    const delay = Math.max(0, this.saveIntervalMs - elapsed);
    this.saveTimer = setTimeout(() => {
      this.flushSave();
    }, delay);
  }

  private async flushSave(): Promise<void> {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    if (!this.isDirty || this.isSaving) return;
    this.isSaving = true;
    try {
      await this.save();
    } catch (error) {
      console.error('Failed to flush scheduled save:', error);
    } finally {
      this.isSaving = false;
    }
  }

  /**
   * Loads game state from the provided save data
   * @param data The saved game data to load (already validated)
   */
  public load(data: GameSaveData): void {
    // Convert fish array to fishCollection if needed
    this.state = {
      ...data,
      fishCollection: Array.isArray(data.fishCollection)
        ? [...data.fishCollection]
        : Array.isArray(data.fish)
          ? data.fish.map(fish => ({
              id: `fish-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              fishData: fish,
              lastSaved: Date.now(),
            }))
          : [],
    };

    this.notifySubscribers();
  }
}

// Create and export the game state instance
export const gameState = GameStateManager.getInstance();
