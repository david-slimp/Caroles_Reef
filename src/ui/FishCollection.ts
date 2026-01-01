// /src/ui/FishCollection.ts

import { gameState } from '../state/GameState';
import { SavedFish } from '../utils/fishStorage';
import gameDataValidator from '../utils/gameDataValidator';
import { storageManager } from '../utils/localStorageManager';

import { TailShape, getTailShapeDisplayName } from './FishCard';
import { toast } from './toast';

const FISH_COLLECTION_ID = 'fishCollectionPanel';

type FishData = SavedFish['fishData'];
type FishEntry = FishData | SavedFish;
type GameStateSnapshot = ReturnType<typeof gameState.getState>;
type GameStateManager = typeof gameState;

class FishCollection {
  private panel: HTMLElement | null = null;
  private onSelectFish: ((fishData: FishEntry) => void) | null = null;
  private sortColumn: string | null = null;
  private sortDirection: 'asc' | 'desc' = 'asc';

  constructor() {
    this.initializeUI();
  }

  private initializeUI(): void {
    // Create the panel if it doesn't exist
    if (!document.getElementById(FISH_COLLECTION_ID)) {
      this.panel = document.createElement('div');
      this.panel.id = FISH_COLLECTION_ID;
      this.panel.className = 'panel';
      this.panel.style.display = 'none';

      // Add panel to the document
      const uiContainer = document.getElementById('ui') || document.body;
      uiContainer.appendChild(this.panel);

      // Initial render
      this.render();

      // Set up event listeners
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && this.panel?.style.display === 'block') {
          this.hide();
        }
      });

      // Close when clicking outside
      this.panel.addEventListener('click', e => {
        if (e.target === this.panel) {
          this.hide();
        }
      });
    }
  }

  public show(onSelectFish?: (fishData: FishEntry) => void): void {
    try {
      console.log('FishCollection.show() called');

      if (!this.panel) {
        console.log('Initializing panel...');
        this.initializeUI();
      }

      if (this.panel) {
        console.log('Panel found, showing...');

        // Set up default fish spawning behavior if no callback is provided
        this.onSelectFish =
          onSelectFish ||
          (async fishData => {
            try {
              // Import fish module dynamically to avoid circular dependencies
              const fishModule = await import('../entities/fish');
              const targetId = fishData.id || fishData.fishData?.id;
              if (
                targetId &&
                (fishModule.hasFishInTank?.(targetId) || this.isFishAlreadyInTank(targetId))
              ) {
                toast('Fish already in tank', true);
                return;
              }

              // Create a new fish with the saved data
              const normalizedFish = gameDataValidator.validateAndTransformFish(
                fishData.fishData || fishData,
                Math.floor(Date.now() / 1000)
              );
              if (!normalizedFish) {
                throw new Error('Invalid fish data for spawn');
              }
              const override = {
                ...normalizedFish,
                id: fishData.id || fishData.fishData?.id,
                name: fishData.name || fishData.fishData?.name,
                // Override position to spawn at a random location in the tank
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                // Reset any state that shouldn't be carried over
                _mateId: null,
                _breedCd: 0,
                _ritualTimer: 0,
                state: 'wander',
              };
              const newFish = fishModule.makeFish({ override });
              newFish.originalId = fishData.id || fishData.fishData?.id;

              // Add the fish to the tank
              fishModule.addFishToTank(newFish);

              // Show a success message
              toast('Fish added to tank!');

              // Keep the collection panel open so user can add more fish
            } catch (error) {
              console.error('Error adding fish to tank:', error);
              toast('Failed to add fish to tank', true);
            }
          });

        this.render();
        this.panel.style.display = 'block';
        console.log('Panel should now be visible');
      } else {
        console.error('Failed to initialize panel');
      }
    } catch (error) {
      console.error('Error in FishCollection.show():', error);
    }
  }

  public hide(): void {
    this.panel!.style.display = 'none';
    this.onSelectFish = null;
  }

  /**
   * Check if the collection panel is currently visible
   */
  public isVisible(): boolean {
    return this.panel ? this.panel.style.display === 'block' : false;
  }

  /**
   * Render the collection panel
   */
  /**
   * Sort fish collection based on current sort column and direction
   */
  private sortFishCollection(fishList: SavedFish[]): SavedFish[] {
    if (!this.sortColumn) return fishList;

    console.log(`Sorting by ${this.sortColumn} (${this.sortDirection})`);

    // Debug: Log the first few fish with their properties
    console.log(
      'Sample fish data:',
      fishList.slice(0, 3).map(fish => ({
        name: fish.name,
        fishData: {
          ...fish.fishData,
          // Only include relevant properties to keep the log clean
          ...(this.sortColumn === 'speed' && { speed: fish.fishData.speed }),
          ...(this.sortColumn === 'sense' && { senseGene: fish.fishData.senseGene }),
          ...(this.sortColumn === 'hue' && { colorHue: fish.fishData.colorHue }),
        },
      }))
    );

    const sorted = [...fishList].sort((a, b) => {
      let valueA: string | number = '';
      let valueB: string | number = '';
      let isNumeric = false;

      // Handle different column types
      switch (this.sortColumn) {
        case 'name':
          valueA = a.name?.toLowerCase() || '';
          valueB = b.name?.toLowerCase() || '';
          break;
        case 'id':
          valueA = a.id;
          valueB = b.id;
          break;
        case 'age':
          valueA = Number(a.fishData.age || 0);
          valueB = Number(b.fishData.age || 0);
          isNumeric = true;
          break;
        case 'size':
          valueA = Number(a.fishData.size || 0);
          valueB = Number(b.fishData.size || 0);
          isNumeric = true;
          break;
        case 'speed': {
          // Debug: Log the entire fish data structure for the first fish
          if (a.fishData) {
            console.log('Fish data structure for speed sort:', {
              name: a.name,
              fishData: a.fishData,
              speed: a.fishData.speed,
              speedType: typeof a.fishData.speed,
              allNumericProperties: Object.entries(a.fishData)
                .filter(([_, v]) => typeof v === 'number')
                .map(([k, v]) => `${k}: ${v} (${typeof v})`),
            });
          }

          // Try to get speed value from different possible locations
          const getSpeed = (fish: SavedFish): number => {
            // Check direct property
            if (typeof fish.fishData.speed === 'number') return fish.fishData.speed;

            // Check for other possible speed properties
            const possibleSpeedProps = ['movementSpeed', 'speedValue', 'baseSpeed', 'spd'];
            for (const prop of possibleSpeedProps) {
              if (typeof fish.fishData[prop] === 'number') return fish.fishData[prop];
            }

            // Default to 0 if no speed found
            return 0;
          };

          valueA = getSpeed(a);
          valueB = getSpeed(b);

          console.log(`Sorting speeds - ${a.name}: ${valueA}, ${b.name}: ${valueB}`);
          isNumeric = true;
          break;
        }
        case 'sense':
          valueA = Number(a.fishData.senseGene || 0);
          valueB = Number(b.fishData.senseGene || 0);
          isNumeric = true;
          break;
        case 'defAffGene':
          valueA = Number(a.fishData.defAffGene || 0);
          valueB = Number(b.fishData.defAffGene || 0);
          isNumeric = true;
          break;
        case 'defAffType':
          valueA = a.fishData.defAffType?.toLowerCase() || '';
          valueB = b.fishData.defAffType?.toLowerCase() || '';
          break;
        case 'hue':
          // Handle hue values (0-360)
          valueA = Number(a.fishData.colorHue || 0);
          valueB = Number(b.fishData.colorHue || 0);
          isNumeric = true;
          break;
        case 'fins':
          valueA = a.fishData.finShape?.toLowerCase() || '';
          valueB = b.fishData.finShape?.toLowerCase() || '';
          break;
        case 'pattern':
          valueA = a.fishData.patternType?.toLowerCase() || '';
          valueB = b.fishData.patternType?.toLowerCase() || '';
          break;
        default:
          return 0;
      }

      // Compare values
      let comparison = 0;
      if (isNumeric) {
        // For numeric comparisons, ensure we're comparing numbers
        comparison = valueA - valueB;
      } else {
        // For string comparisons
        if (valueA > valueB) comparison = 1;
        else if (valueA < valueB) comparison = -1;
      }

      // Apply sort direction
      const result = this.sortDirection === 'asc' ? comparison : -comparison;

      // Debug log
      if (this.sortColumn === 'speed') {
        console.log(`Comparing speed: ${a.fishData.speed} vs ${b.fishData.speed} = ${result}`);
      } else if (this.sortColumn === 'sense') {
        console.log(
          `Comparing sense: ${a.fishData.senseGene} vs ${b.fishData.senseGene} = ${result}`
        );
      } else if (this.sortColumn === 'defAffGene') {
        console.log(
          `Comparing def aff: ${a.fishData.defAffGene} vs ${b.fishData.defAffGene} = ${result}`
        );
      } else if (this.sortColumn === 'hue') {
        console.log(`Comparing hue: ${a.fishData.colorHue} vs ${b.fishData.colorHue} = ${result}`);
      }

      return result;
    });

    // Debug log the sorted order
    if (this.sortColumn === 'speed') {
      console.log(
        'Sorted speed values:',
        sorted.map(fish => ({
          name: fish.name,
          speed: fish.fishData.speed,
          speedType: typeof fish.fishData.speed,
          rawSpeed: fish.fishData.speed,
        }))
      );
    } else if (this.sortColumn === 'sense') {
      console.log(
        'Sorted order:',
        sorted.map(fish => ({
          name: fish.name,
          senseGene: fish.fishData.senseGene,
          senseType: typeof fish.fishData.senseGene,
        }))
      );
    } else if (this.sortColumn === 'defAffGene') {
      console.log(
        'Sorted def aff values:',
        sorted.map(fish => ({
          name: fish.name,
          defAffGene: fish.fishData.defAffGene,
          defAffType: fish.fishData.defAffType,
        }))
      );
    }

    return sorted;
  }

  /**
   * Handle column header click for sorting
   */
  private handleSort(column: string): void {
    console.log(`handleSort called for column: ${column}`);

    if (this.sortColumn === column) {
      // Toggle sort direction if clicking the same column
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // New column, default to ascending
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    // Debug: Log the fish data structure for the first few fish
    const fishList = this.getSavedFish();
    console.log(
      'Fish data structure sample:',
      fishList.slice(0, 3).map(fish => ({
        name: fish.name,
        fishData: {
          ...Object.entries(fish.fishData).reduce(
            (acc, [key, value]) => {
              // Only include numeric or relevant properties to keep the log clean
              if (
                typeof value === 'number' ||
                key === 'speed' ||
                key === 'senseGene' ||
                key === 'colorHue'
              ) {
                acc[key] = value;
              }
              return acc;
            },
            {} as Record<string, unknown>
          ),
        },
      }))
    );

    // Debug: Log the first few fish's values for the current column
    if (column === 'speed' || column === 'sense' || column === 'hue') {
      console.log(
        `First 5 fish ${column} values:`,
        fishList.slice(0, 5).map(f => {
          const value =
            column === 'sense'
              ? f.fishData.senseGene
              : column === 'hue'
                ? f.fishData.colorHue
                : f.fishData.speed;
          return {
            name: f.name,
            [column]: value,
            type: typeof value,
            rawValue: value,
          };
        })
      );
    }

    this.render();
  }

  private render(): void {
    if (!this.panel) {
      console.error('Cannot render: panel element not found');
      return;
    }

    if (DEBUG_FISH_COLLECTION) {
      console.log('Rendering fish collection...');
    }
    const savedFish = this.getSavedFish();
    if (DEBUG_FISH_COLLECTION) {
      console.log(`Total fish to render: ${savedFish.length}`);
    }

    const sortedFish = this.sortFishCollection(savedFish);
    if (DEBUG_FISH_COLLECTION) {
      console.log(`Sorted ${sortedFish.length} fish for display`);
    }

    this.panel.innerHTML = `
      <style>
        .fish-collection-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          margin-top: 10px;
        }
        
        .fish-collection-table th {
          text-align: left;
          padding: 8px 12px;
          background: rgba(0,0,0,0.2);
          border-bottom: 2px solid rgba(255,255,255,0.1);
          font-weight: 600;
          color: #ccc;
          position: sticky;
          top: 0;
          user-select: none;
        }
        
        .sortable {
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .sortable:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .fish-collection-table td {
          padding: 6px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          vertical-align: middle;
        }
        
        .fish-row:hover {
          background: rgba(255,255,255,0.05);
        }
        
        .fish-name {
          min-width: 150px;
        }
        
        .name.editable {
          cursor: pointer;
          padding: 2px 4px;
          border-radius: 3px;
          transition: background-color 0.2s;
        }
        
        .name.editable:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .fish-name-input {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 2px 4px;
          border-radius: 3px;
          font-family: inherit;
          font-size: inherit;
          outline: none;
        }
        
        .fish-name-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .fish-icon {
          display: inline-flex;
          opacity: 0.8;
        }
        
        .color-swatch {
          display: inline-block;
          width: 16px;
          height: 16px;
          border-radius: 3px;
          border: 1px solid rgba(255,255,255,0.2);
          vertical-align: middle;
        }
        
        .indicators {
          margin-left: 4px;
          color: #ffcc00;
        }
        
        .btn-add, .btn-delete {
          background: none;
          border: 1px solid rgba(255,255,255,0.2);
          color: #fff;
          width: 24px;
          height: 24px;
          border-radius: 4px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          font-size: 14px;
          line-height: 1;
        }
        
        .btn-add:hover {
          background: rgba(100, 200, 100, 0.2);
          border-color: #6c6;
        }
        
        .btn-delete:hover {
          background: rgba(200, 100, 100, 0.2);
          border-color: #c66;
        }
        
        .fish-stats-row {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
        }
      </style>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h3>My Fish Collection <span style="font-size: 0.8em; opacity: 0.8;">(${savedFish.length} fish)</span></h3>
        <button id="closeCollection" style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer;">&times;</button>
      </div>
      <style>
        .table-wrapper {
          max-height: 70vh;
          overflow: auto;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 4px;
        }
        
        .fish-collection-table {
          width: 100%;
          min-width: 1000px;
          table-layout: fixed;
        }
        
        .fish-collection-table th,
        .fish-collection-table td {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .fish-actions {
          display: flex;
          gap: 4px;
          justify-content: flex-end;
        }
        
        .fish-id {
          font-family: monospace;
          max-width: 150px;
        }
      </style>
      <div class="table-wrapper">
        <table class="fish-collection-table">
          <thead>
            <tr>
              <th style="width: 40px;">+</th>
              <th style="min-width: 120px;" class="sortable" data-column="name">
                Name ${this.sortColumn === 'name' ? (this.sortDirection === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style="min-width: 120px;" class="sortable" data-column="id">
                ID ${this.sortColumn === 'id' ? (this.sortDirection === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style="width: 50px;" class="sortable" data-column="age">
                Age ${this.sortColumn === 'age' ? (this.sortDirection === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style="width: 50px;" class="sortable" data-column="size">
                Size ${this.sortColumn === 'size' ? (this.sortDirection === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style="width: 50px;">Sex</th>
              <th style="width: 60px;" class="sortable" data-column="speed">
                Speed ${this.sortColumn === 'speed' ? (this.sortDirection === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style="width: 60px;" class="sortable" data-column="sense">
                Sense ${this.sortColumn === 'sense' ? (this.sortDirection === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style="width: 70px;" class="sortable" data-column="defAffGene">
                Def Aff ${this.sortColumn === 'defAffGene' ? (this.sortDirection === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style="width: 80px;" class="sortable" data-column="defAffType">
                Def Type ${this.sortColumn === 'defAffType' ? (this.sortDirection === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style="width: 50px;" class="sortable" data-column="hue">
                Hue ${this.sortColumn === 'hue' ? (this.sortDirection === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style="width: 40px;">Color</th>
              <th style="min-width: 80px;" class="sortable" data-column="fins">
                Fins ${this.sortColumn === 'fins' ? (this.sortDirection === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style="min-width: 80px;" class="sortable" data-column="pattern">
                Pattern ${this.sortColumn === 'pattern' ? (this.sortDirection === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style="width: 40px;">×</th>
            </tr>
          </thead>
          <tbody>
            ${
              sortedFish.length > 0
                ? sortedFish.map(fish => this.createFishCard(fish)).join('')
                : `<tr><td colspan="15" class="no-fish">No fish in your collection yet. Select a fish and click "Save to Collection".</td></tr>`
            }
          </tbody>
        </table>
      </div>
      <div class="collection-actions">
        <button id="closeCollectionBtn">Close</button>
      </div>
    `;

    // Add event listeners
    document.getElementById('closeCollection')?.addEventListener('click', () => this.hide());
    document.getElementById('closeCollectionBtn')?.addEventListener('click', () => this.hide());

    // Add sort handlers to column headers
    this.panel?.querySelectorAll('.sortable').forEach(header => {
      header.addEventListener('click', e => {
        const column = (e.currentTarget as HTMLElement).getAttribute('data-column');
        if (column) {
          this.handleSort(column);
        }
      });

      // Add hover effect
      header.addEventListener('mouseenter', () => {
        (header as HTMLElement).style.cursor = 'pointer';
        (header as HTMLElement).style.textDecoration = 'underline';
      });

      header.addEventListener('mouseleave', () => {
        (header as HTMLElement).style.textDecoration = 'none';
      });
    });

    // Add event delegation for all interactive elements
    this.panel?.addEventListener('click', e => {
      const target = e.target as HTMLElement;

      // Handle delete button clicks
      const deleteBtn = target.closest('.btn-delete');
      if (deleteBtn) {
        e.preventDefault();
        e.stopPropagation();
        const fishId = deleteBtn.getAttribute('data-id');
        if (fishId) {
          this.removeFish(fishId);
        }
        return;
      }

      // Handle name clicks for editing
      const nameElement = target.closest('.name.editable') as HTMLElement;
      if (nameElement) {
        e.stopPropagation();
        const fishId = nameElement.getAttribute('data-fish-id');
        if (fishId) {
          this.startRenamingFish(fishId, nameElement);
        }
      }
    });

    // Add event listeners for select buttons
    savedFish.forEach(fish => {
      const selectBtn = document.getElementById(`select-fish-${fish.id}`);
      if (selectBtn) {
        selectBtn.addEventListener('click', () => {
          if (this.onSelectFish) {
            this.onSelectFish(fish);
          }
        });
      }
    });
  }

  private createFishCard(fish: SavedFish): string {
    const fishData = fish.fishData;
    const fishName = fish.name || 'Unnamed Fish';

    // Format stats
    const formatStat = (value: number) =>
      value !== undefined ? Math.floor(value).toString() : 'N/A';

    // Create a tiny color swatch
    const colorSwatch = `<span class="color-swatch" style="background-color: hsl(${fishData.colorHue || 0}, 80%, 50%)" title="Hue ${fishData.colorHue || 0}°"></span>`;

    // Create favorite and shiny indicators
    const indicators = [fishData.favorite ? '★' : '', fishData.shiny ? '✨' : '']
      .filter(Boolean)
      .join(' ');

    return `
      <tr class="fish-row" data-id="${fish.id}">
        <td class="fish-add">
          <button class="btn-add" id="select-fish-${fish.id}" title="Add to tank">+</button>
        </td>
        <td class="fish-name">
          <div class="fish-name-cell" data-fish-id="${fish.id}">
            <span class="name editable" data-fish-id="${fish.id}" title="Click to rename">${fishName}</span>
            ${indicators ? `<span class="indicators">${indicators}</span>` : ''}
          </div>
        </td>
        <td class="fish-id" title="${fish.id}">${fish.id}</td>
        <td class="fish-age">${Math.floor(fishData.age || 0)}</td>
        <td class="fish-size">${formatStat(fishData.size)}</td>
        <td class="fish-sex">${fishData.sex || '—'}</td>
        <td class="fish-speed">${formatStat(fishData.speed)}</td>
        <td class="fish-sense">${formatStat(fishData.senseGene)}</td>
        <td class="fish-def-aff">${formatStat(fishData.defAffGene)}</td>
        <td class="fish-def-type">${fishData.defAffType || '—'}</td>
        <td class="fish-hue">${fishData.colorHue || 0}°</td>
        <td class="fish-color">${colorSwatch}</td>
        <td class="fish-fins">${fishData.finShape ? getTailShapeDisplayName(fishData.finShape as TailShape) : '—'}</td>
        <td class="fish-pattern">${fishData.patternType || '—'}</td>
        <td class="fish-actions">
          <button class="btn-delete" data-id="${fish.id}" title="Delete from collection">×</button>
        </td>
      </tr>
    `;
  }

  /**
   * Get all saved fish from the game state
   */
  public getSavedFish(): SavedFish[] {
    try {
      if (DEBUG_FISH_COLLECTION) {
        console.log('Getting saved fish from game state...');
      }
      const gameState = this.getGameState();

      if (!gameState) {
        if (DEBUG_FISH_COLLECTION) {
          console.log('No gameState available, using storage manager cache');
        }
        const currentData = storageManager.getCurrentData();
        return Array.isArray(currentData.fishCollection) ? currentData.fishCollection : [];
      }

      const state = gameState.getState();
      if (DEBUG_FISH_COLLECTION) {
        console.log('Current game state:', state);
      }

      // Check for fish collection in the root of the state
      if (state?.fishCollection) {
        const fish = Array.isArray(state.fishCollection) ? state.fishCollection : [];
        if (DEBUG_FISH_COLLECTION) {
          console.log(`Retrieved ${fish.length} fish from gameState.fishCollection`);
        }
        return fish;
      }

      // Fallback: Check if fish are stored in the gameState object directly
      if (state?.gameState?.fishCollection) {
        const fish = Array.isArray(state.gameState.fishCollection)
          ? state.gameState.fishCollection
          : [];
        if (DEBUG_FISH_COLLECTION) {
          console.log(`Retrieved ${fish.length} fish from gameState.gameState.fishCollection`);
        }
        return fish;
      }

      if (DEBUG_FISH_COLLECTION) {
        console.log('No fish collection found in gameState');
      }
      return [];
    } catch (error) {
      console.error('Error in getSavedFish:', error);
      return [];
    }
  }

  private refreshCollection(): void {
    if (this.panel) {
      this.render();
    }
  }

  private isFishAlreadyInTank(fishId: string): boolean {
    const env = (window as { env?: { fish?: Array<{ id?: string; originalId?: string }> } }).env;
    if (env && Array.isArray(env.fish)) {
      return env.fish.some(fish => fish.id === fishId || fish.originalId === fishId);
    }
    return false;
  }

  private removeFish(fishId: string): boolean {
    console.log('removeFish called with ID:', fishId);
    try {
      // Get current fish collection
      let currentFish = this.getSavedFish();

      // Find the fish to remove
      const fishIndex = currentFish.findIndex(fish => fish.id === fishId);
      if (fishIndex === -1) {
        console.warn(`Fish with ID ${fishId} not found in collection`);
        return false;
      }

      // Remove the fish from the collection
      currentFish = currentFish.filter(fish => fish.id !== fishId);

      // Update the state
      const gameState = this.getGameState();
      if (gameState) {
        gameState.updateState((state: GameStateSnapshot) => ({
          ...state,
          fishCollection: currentFish,
        }));
        // Persist via GameState/LocalStorageManager path only.
        gameState.save();
      } else {
        const currentData = storageManager.getCurrentData();
        storageManager.save({ ...currentData, fishCollection: currentFish });
      }

      // Remove just the row from the DOM
      const row = this.panel?.querySelector(`tr[data-id="${fishId}"]`);
      if (row) {
        // Add fade-out effect
        (row as HTMLElement).style.transition = 'opacity 1.0s';
        (row as HTMLElement).style.opacity = '0';

        // Remove from DOM after animation completes
        setTimeout(() => {
          row.remove();

          // Update the fish count in the header
          const countElement = this.panel?.querySelector('h3 span');
          if (countElement) {
            countElement.textContent = `(${savedFish.length} fish)`;
          }

          // If no fish left, close the panel
          if (savedFish.length === 0) {
            this.hide();
          }
        }, 200);
      }

      toast('Fish removed from collection');
      return true;
    } catch (error) {
      console.error('Error removing fish:', error);
      toast('Failed to remove fish', true);
      return false;
    }
  }

  /**
   * Spawn a fish from saved data into the tank
   */
  public async spawnFishFromData(fishData: FishEntry): Promise<boolean> {
    console.log('[FishCollection] Starting to spawn fish with data:', fishData);

    try {
      // Import fish module dynamically
      console.log('[FishCollection] Importing fish module...');
      const fishModule = await import('../entities/fish');
      const targetId = fishData.id || fishData.fishData?.id;
      if (
        targetId &&
        (fishModule.hasFishInTank?.(targetId) || this.isFishAlreadyInTank(targetId))
      ) {
        toast('Fish already in tank', true);
        return false;
      }

      console.log('[FishCollection] Creating fish with position and state...');
      const fishConfig = {
        ...fishData,
        // Set initial position
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        // Reset state
        _mateId: null,
        _breedCd: 0,
        _ritualTimer: 0,
        state: 'wander',
      };

      console.log('[FishCollection] Calling makeFish with config:', fishConfig);
      const normalizedFish = gameDataValidator.validateAndTransformFish(
        fishData.fishData || fishData,
        Math.floor(Date.now() / 1000)
      );
      if (!normalizedFish) {
        throw new Error('Invalid fish data for spawn');
      }
      const override = {
        ...normalizedFish,
        id: fishData.id || fishData.fishData?.id,
        name: fishData.name || fishData.fishData?.name,
        x: fishConfig.x,
        y: fishConfig.y,
        _mateId: fishConfig._mateId,
        _breedCd: fishConfig._breedCd,
        _ritualTimer: fishConfig._ritualTimer,
        state: fishConfig.state,
      };
      const newFish = fishModule.makeFish({ override });
      newFish.originalId = fishData.id || fishData.fishData?.id;
      fishModule.addFishToTank(newFish);

      if (!newFish || !newFish.id) {
        console.error(
          '[FishCollection] Failed to create fish - invalid fish object returned:',
          newFish
        );
        throw new Error('Failed to create fish - invalid fish object returned');
      }

      console.log(`[FishCollection] Successfully created fish with ID: ${newFish.id}`);

      // Verify the fish was added to the tank
      const { gameState } = await import('../state/GameState');
      const state = gameState.getState();
      const fishInTank = state.fishInTank || [];
      console.log(`[FishCollection] Current fish in tank:`, fishInTank);

      if (!fishInTank.includes(newFish.id)) {
        console.warn(`[FishCollection] Fish ${newFish.id} not found in tank after creation`);
      } else {
        console.log(`[FishCollection] Fish ${newFish.id} successfully added to tank`);
      }

      // Show success message
      toast('Fish added to tank!');

      return true;
    } catch (error) {
      console.error('[FishCollection] Error spawning fish:', error);
      toast('Failed to add fish to tank', true);
      return false;
    }
  }

  /**
   * Get the game state instance
   */
  private getGameState(): GameStateManager | null {
    // Try to get gameState from window
    if ((window as { gameState?: GameStateManager }).gameState) {
      return (window as { gameState?: GameStateManager }).gameState;
    }

    if (gameState) {
      (window as { gameState?: GameStateManager }).gameState = gameState;
      return gameState;
    }

    return null;
  }

  /**
   * Save a fish to the collection
   */
  public saveFish(fishData: FishData): SavedFish | null {
    try {
      console.log('Saving fish to collection:', fishData);

      // Generate a unique ID if one doesn't exist
      const fishId = fishData.id || `fish_${Date.now()}`;

      // Get the current game state
      const gameState = this.getGameState();
      let currentFishCollection: SavedFish[] = [];

      // Try to load existing collection from gameState
      if (gameState) {
        const state = gameState.getState();
        currentFishCollection = Array.isArray(state?.fishCollection)
          ? [...state.fishCollection]
          : [];
      }

      if (currentFishCollection.length === 0) {
        const currentData = storageManager.getCurrentData();
        currentFishCollection = Array.isArray(currentData.fishCollection)
          ? [...currentData.fishCollection]
          : [];
      }

      // Check if fish already exists
      const existingIndex = currentFishCollection.findIndex(f => f.id === fishId);

      const normalizedFish = gameDataValidator.validateAndTransformFish(
        fishData,
        Math.floor(Date.now() / 1000)
      );
      if (!normalizedFish) {
        throw new Error('Invalid fish data');
      }

      // Create or update the fish entry
      const fishEntry = {
        id: fishId,
        name: normalizedFish.name || fishData.name || 'NEW',
        lastSaved: Date.now(),
        fishData: {
          ...normalizedFish,
          id: fishId, // Ensure ID is set
          x: normalizedFish.x,
          y: normalizedFish.y,
          _mateId: null, // Reset mate ID
          _breedCd: 0, // Reset breed cooldown
          _ritualTimer: 0, // Reset ritual timer
          state: 'wander', // Reset state
        },
      };

      if (existingIndex >= 0) {
        // Update existing fish
        currentFishCollection[existingIndex] = fishEntry;
        console.log(`Updated fish ${fishId} in collection`);
      } else {
        // Add new fish
        currentFishCollection.push(fishEntry);
        console.log(`Added new fish ${fishId} to collection`);
      }

      // Save back to gameState if available
      if (gameState) {
        gameState.updateState((state: GameStateSnapshot) => ({
          ...state,
          fishCollection: currentFishCollection,
        }));
        // Persist via GameState/LocalStorageManager path only.
        gameState.save();
      } else {
        const currentData = storageManager.getCurrentData();
        storageManager.save({ ...currentData, fishCollection: currentFishCollection });
      }

      // Show success message
      toast('Fish saved to collection!');

      // Refresh the collection display
      this.refreshCollection();

      return fishEntry;
    } catch (error) {
      console.error('Error saving fish to collection:', error);
      toast('Failed to save fish to collection', true);
      return null;
    }
  }

  /**
   * Start renaming a fish
   */
  private startRenamingFish(fishId: string, nameElement: HTMLElement): void {
    const savedFish = this.getSavedFish();
    const fish = savedFish.find(f => f.id === fishId);
    if (!fish) return;

    const currentName = fish.name || '';
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName;
    input.className = 'fish-name-input';
    input.style.width = `${Math.max(100, currentName.length * 8)}px`;

    // Replace the name with an input field
    nameElement.replaceWith(input);
    input.focus();

    // Select all text in the input
    input.select();

    // Track if we're already handling a submit to prevent duplicates
    let isSubmitting = false;

    // Handle input submission
    const handleSubmit = () => {
      // Prevent multiple submissions
      if (isSubmitting) return;
      isSubmitting = true;

      const newName = input.value.trim();
      if (newName && newName !== currentName) {
        this.renameFish(fishId, newName);
      } else {
        // Revert to original name if empty or unchanged
        const span = document.createElement('span');
        span.className = 'name editable';
        span.setAttribute('data-fish-id', fishId);
        span.textContent = currentName;
        span.title = 'Click to rename';
        input.replaceWith(span);
      }

      // Reset the flag after a short delay
      setTimeout(() => {
        isSubmitting = false;
      }, 100);
    };

    // Handle Enter key
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        // Remove the blur handler temporarily to prevent duplicate submission
        input.removeEventListener('blur', handleSubmit);
        handleSubmit();
        // Re-add the blur handler after a short delay
        setTimeout(() => {
          input.addEventListener('blur', handleSubmit);
        }, 0);
      } else if (e.key === 'Escape') {
        const span = document.createElement('span');
        span.className = 'name editable';
        span.setAttribute('data-fish-id', fishId);
        span.textContent = currentName;
        span.title = 'Click to rename';
        input.replaceWith(span);
      }
    });

    // Add blur handler
    input.addEventListener('blur', handleSubmit);
  }

  /**
   * Rename a fish in the collection and update all references
   */
  private renameFish(fishId: string, newName: string): boolean {
    try {
      const savedFish = this.getSavedFish();
      const fishIndex = savedFish.findIndex(fish => fish.id === fishId);

      if (fishIndex === -1) return false;

      // Get the original fish data
      const fishData = savedFish[fishIndex];
      const originalId = fishData.fishData.originalId || fishData.fishData.id;

      // Update the fish name in the collection
      fishData.name = newName;
      fishData.fishData.name = newName;

      // Update the state using gameState if available
      const gameState = this.getGameState();
      if (gameState) {
        gameState.updateState((state: GameStateSnapshot) => ({
          ...state,
          fishCollection: savedFish,
        }));
        // Persist via GameState/LocalStorageManager path only.
        gameState.save();
      } else {
        const currentData = storageManager.getCurrentData();
        storageManager.save({ ...currentData, fishCollection: savedFish });
      }

      // Update the fish in the tank if it exists
      import('../entities/fish')
        .then(fishModule => {
          const targetId = originalId || fishId;
          const updated = targetId ? fishModule.updateFishNameInTank?.(targetId, newName) : false;
          if (updated) {
            this.updateFishCardNameIfVisible(fishId, originalId, newName);
          }
        })
        .catch(error => {
          console.error('Error updating fish in tank:', error);
        });

      // Update the UI
      this.refreshCollection();

      // Show success message
      toast('Fish renamed successfully');

      return true;
    } catch (error) {
      console.error('Error renaming fish:', error);
      toast('Failed to rename fish', true);
      return false;
    }
  }

  private updateFishCardNameIfVisible(
    fishId: string,
    originalId: string | undefined,
    newName: string
  ): void {
    const fishCard = document.getElementById('fishCard');
    if (!fishCard || fishCard.style.display !== 'block') {
      return;
    }

    const idElement = fishCard.querySelector('#fc-id') as HTMLElement | null;
    const currentId = idElement?.textContent || '';
    if (currentId !== fishId && (!originalId || currentId !== originalId)) {
      return;
    }

    const nameElement = fishCard.querySelector('#fc-name') as HTMLElement | null;
    if (nameElement) {
      nameElement.textContent = newName || 'Unnamed Fish';
    }

    const inputElement = fishCard.querySelector('#renameFish') as HTMLInputElement | null;
    if (inputElement) {
      inputElement.value = newName;
    }
  }
}

const DEBUG_FISH_COLLECTION = false;

// Create and export a singleton instance
const fishCollection = new FishCollection();

// Make it globally available
if (typeof window !== 'undefined') {
  (window as { fishCollection?: FishCollection }).fishCollection = fishCollection;
}

export { fishCollection };
