// /src/ui/NewCollectionModal.ts

import { gameState } from '../state/GameState';
import { SavedFish } from '../utils/fishStorage';
import gameDataValidator from '../utils/gameDataValidator';
import { storageManager } from '../utils/localStorageManager';
import type { InventoryPreset, InventoryFilterRule } from '../utils/localStorageManager';

import { TailShape, getTailShapeDisplayName } from './FishCard';
import { toast } from './toast';

const NEW_COLLECTION_ID = 'newCollectionModal';

type FishData = SavedFish['fishData'];
type FishEntry = FishData | SavedFish;
type GameStateSnapshot = ReturnType<typeof gameState.getState>;
type GameStateManager = typeof gameState;

type FilterState =
  | { type: 'set'; excluded: Set<string> }
  | { type: 'number-set'; excluded: Set<string> }
  | { type: 'number-range'; min: number | null; max: number | null }
  | { type: 'text'; query: string };

type FilterDef = {
  type: FilterState['type'];
  options?: Array<string | number>;
};

const COLUMN_LABELS: Record<string, string> = {
  name: 'Name',
  sex: 'Sex',
  age: 'Age',
  size: 'Size',
  speed: 'Speed',
  senseGene: 'Sense',
  hungerDrive: 'Hunger',
  constitution: 'Constitution',
  rarityGene: 'Rarity',
  defAffGene: 'Def Aff',
  defAffType: 'Def Type',
  colorHue: 'Hue',
  finShape: 'Fins',
  patternType: 'Pattern',
  eyeType: 'Eyes',
  species: 'Species',
  generation: 'Gen',
  id: 'ID',
  originalId: 'Original ID',
  maxSize: 'Max Size',
  favorite: 'Favorite',
  shiny: 'Shiny',
  state: 'State',
  x: 'X',
  y: 'Y',
  birthTime: 'Birth Time',
  lastSaved: 'Last Saved',
  saveDate: 'Save Date',
};

const FILTER_DEFS: Record<string, FilterDef> = {
  name: { type: 'text' },
  sex: { type: 'set', options: ['M', 'F'] },
  age: { type: 'number-range' },
  size: { type: 'number-range' },
  speed: { type: 'number-set', options: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] },
  senseGene: { type: 'number-set', options: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] },
  hungerDrive: { type: 'number-set', options: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] },
  constitution: { type: 'number-set', options: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] },
  rarityGene: { type: 'number-set', options: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] },
  defAffGene: {
    type: 'number-set',
    options: [-9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  },
  defAffType: { type: 'set', options: ['plant', 'coral', 'rock', 'chest'] },
  colorHue: { type: 'number-range' },
  finShape: { type: 'set', options: ['pointy', 'round', 'fan', 'forked', 'lunate'] },
  patternType: { type: 'set', options: ['solid', 'gradient', 'spots', 'stripes'] },
  eyeType: { type: 'set', options: ['round', 'sleepy', 'sparkly', 'winking'] },
  species: { type: 'text' },
  generation: { type: 'number-range' },
  id: { type: 'text' },
  originalId: { type: 'text' },
  maxSize: { type: 'number-range' },
  favorite: { type: 'set', options: ['yes', 'no'] },
  shiny: { type: 'set', options: ['yes', 'no'] },
  state: { type: 'text' },
  x: { type: 'number-range' },
  y: { type: 'number-range' },
  birthTime: { type: 'number-range' },
  lastSaved: { type: 'number-range' },
  saveDate: { type: 'text' },
};

const DEFAULT_COLUMN_ORDER = [
  'name',
  'sex',
  'age',
  'size',
  'speed',
  'senseGene',
  'hungerDrive',
  'constitution',
  'rarityGene',
  'defAffGene',
  'defAffType',
  'colorHue',
  'finShape',
  'patternType',
  'eyeType',
  'species',
  'generation',
  'id',
  'originalId',
  'maxSize',
  'favorite',
  'shiny',
  'state',
  'x',
  'y',
  'birthTime',
  'lastSaved',
  'saveDate',
];

function buildDefaultColumnVisibility(): Record<string, boolean> {
  return DEFAULT_COLUMN_ORDER.reduce<Record<string, boolean>>((acc, column) => {
    acc[column] = true;
    return acc;
  }, {});
}

const COLUMN_DEFS: Record<
  string,
  { label: string; width: string; sortable: boolean; filterable: boolean }
> = {
  name: { label: 'Name', width: 'width: 200px;', sortable: true, filterable: true },
  sex: { label: 'Sex', width: 'width: 58px;', sortable: true, filterable: true },
  age: { label: 'Age', width: 'width: 58px;', sortable: true, filterable: true },
  size: { label: 'Size', width: 'width: 58px;', sortable: true, filterable: true },
  speed: { label: 'Speed', width: 'width: 58px;', sortable: true, filterable: true },
  senseGene: { label: 'Sense', width: 'width: 58px;', sortable: true, filterable: true },
  hungerDrive: { label: 'Hunger', width: 'width: 58px;', sortable: true, filterable: true },
  constitution: { label: 'Constitution', width: 'width: 58px;', sortable: true, filterable: true },
  rarityGene: { label: 'Rarity', width: 'width: 58px;', sortable: true, filterable: true },
  defAffGene: {
    label: 'Def Aff',
    width: 'width: 72px;',
    sortable: true,
    filterable: true,
  },
  defAffType: {
    label: 'Def Type',
    width: 'width: 78px;',
    sortable: true,
    filterable: true,
  },
  colorHue: { label: 'Hue', width: 'width: 72px;', sortable: true, filterable: true },
  finShape: { label: 'Fins', width: 'width: 58px;', sortable: true, filterable: true },
  patternType: { label: 'Pattern', width: 'width: 58px;', sortable: true, filterable: true },
  eyeType: { label: 'Eyes', width: 'width: 58px;', sortable: true, filterable: true },
  species: { label: 'Species', width: 'width: 72px;', sortable: true, filterable: true },
  generation: { label: 'Gen', width: 'width: 58px;', sortable: true, filterable: true },
  id: { label: 'ID', width: 'width: 96px;', sortable: true, filterable: true },
  originalId: {
    label: 'Original ID',
    width: 'width: 96px;',
    sortable: true,
    filterable: true,
  },
  maxSize: { label: 'Max Size', width: 'width: 58px;', sortable: true, filterable: true },
  favorite: { label: 'Favorite', width: 'width: 58px;', sortable: true, filterable: true },
  shiny: { label: 'Shiny', width: 'width: 58px;', sortable: true, filterable: true },
  state: { label: 'State', width: 'width: 70px;', sortable: true, filterable: true },
  x: { label: 'X', width: 'width: 58px;', sortable: true, filterable: true },
  y: { label: 'Y', width: 'width: 58px;', sortable: true, filterable: true },
  birthTime: { label: 'Birth Time', width: 'width: 78px;', sortable: true, filterable: true },
  lastSaved: { label: 'Last Saved', width: 'width: 78px;', sortable: true, filterable: true },
  saveDate: { label: 'Save Date', width: 'width: 78px;', sortable: true, filterable: true },
};

class NewCollectionModal {
  private panel: HTMLElement | null = null;
  private onSelectFish: ((fishData: FishEntry) => void) | null = null;
  private sortColumn: string | null = null;
  private sortDirection: 'asc' | 'desc' = 'asc';
  private activeFilterColumn: string | null = null;
  private filters: Record<string, FilterState> = {};
  private presets: InventoryPreset[] = [];
  private selectedPresetId = 'preset-all';
  private columnOrder = [...DEFAULT_COLUMN_ORDER];
  private columnVisibility = buildDefaultColumnVisibility();
  private draggingColumn: string | null = null;
  private dragOverColumn: string | null = null;
  private panelEventsBound = false;

  private handlePanelClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;

    const filterClose = target.closest('[data-filter-close]') as HTMLElement | null;
    if (filterClose) {
      e.preventDefault();
      this.activeFilterColumn = null;
      this.render();
      return;
    }

    const filterReset = target.closest('[data-filter-reset]') as HTMLElement | null;
    if (filterReset) {
      e.preventDefault();
      const column = filterReset.getAttribute('data-filter-reset');
      if (column) {
        delete this.filters[column];
      }
      this.render();
      return;
    }

    const filterToggle = target.closest('[data-filter-toggle]') as HTMLElement | null;
    if (filterToggle) {
      e.preventDefault();
      const column = filterToggle.getAttribute('data-filter-toggle');
      const value = filterToggle.getAttribute('data-filter-value');
      if (column && value !== null) {
        const filter = this.getFilterState(column);
        if (filter.type === 'set' || filter.type === 'number-set') {
          if (filter.excluded.has(value)) {
            filter.excluded.delete(value);
          } else {
            filter.excluded.add(value);
          }
        }
        this.render();
      }
      return;
    }

    const hideButton = target.closest('[data-hide]') as HTMLElement | null;
    if (hideButton) {
      e.preventDefault();
      const column = hideButton.getAttribute('data-hide');
      if (column) {
        this.columnVisibility[column] = false;
        this.render();
      }
      return;
    }

    const unhideButton = target.closest('[data-unhide]') as HTMLElement | null;
    if (unhideButton) {
      e.preventDefault();
      const column = unhideButton.getAttribute('data-unhide');
      if (column) {
        this.columnVisibility[column] = true;
        this.render();
      }
      return;
    }

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
  };

  private handlePanelInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (!target) return;

    const textColumn = target.getAttribute('data-filter-input');
    if (textColumn) {
      const filter = this.getFilterState(textColumn);
      if (filter.type === 'text') {
        filter.query = target.value;
        const caretPos = target.selectionStart ?? target.value.length;
        this.renderAndRestoreFocus(`[data-filter-input="${textColumn}"]`, caretPos);
      }
      return;
    }

    const minColumn = target.getAttribute('data-filter-min');
    if (minColumn) {
      const filter = this.getFilterState(minColumn);
      if (filter.type === 'number-range') {
        const value = target.value.trim();
        const parsed = value === '' ? null : Number(value);
        filter.min = parsed === null || Number.isNaN(parsed) ? null : parsed;
        const caretPos = target.selectionStart ?? target.value.length;
        this.renderAndRestoreFocus(`[data-filter-min="${minColumn}"]`, caretPos);
      }
      return;
    }

    const maxColumn = target.getAttribute('data-filter-max');
    if (maxColumn) {
      const filter = this.getFilterState(maxColumn);
      if (filter.type === 'number-range') {
        const value = target.value.trim();
        const parsed = value === '' ? null : Number(value);
        filter.max = parsed === null || Number.isNaN(parsed) ? null : parsed;
        const caretPos = target.selectionStart ?? target.value.length;
        this.renderAndRestoreFocus(`[data-filter-max="${maxColumn}"]`, caretPos);
      }
    }
  };

  constructor() {
    this.initializeUI();
  }

  private initializeUI(): void {
    // Create the panel if it doesn't exist
    if (!document.getElementById(NEW_COLLECTION_ID)) {
      this.panel = document.createElement('div');
      this.panel.id = NEW_COLLECTION_ID;
      this.panel.className = 'inventory-modal';
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

      if (!this.panelEventsBound) {
        this.panel.addEventListener('click', this.handlePanelClick);
        this.panel.addEventListener('input', this.handlePanelInput);
        this.panelEventsBound = true;
      }
    }
  }

  public show(onSelectFish?: (fishData: FishEntry) => void): void {
    try {
      console.log('NewCollectionModal.show() called');

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
              const savedX = Number(fishData.fishData?.x ?? fishData.x);
              const savedY = Number(fishData.fishData?.y ?? fishData.y);
              const viewportW = Math.max(0, window.innerWidth);
              const viewportH = Math.max(0, window.innerHeight);
              const hasSavedPos = Number.isFinite(savedX) && Number.isFinite(savedY);
              const fallbackX = viewportW / 2;
              const fallbackY = viewportH / 2;
              const clampedX = hasSavedPos ? Math.min(Math.max(savedX, 0), viewportW) : fallbackX;
              const clampedY = hasSavedPos ? Math.min(Math.max(savedY, 0), viewportH) : fallbackY;
              const override = {
                ...normalizedFish,
                id: fishData.id || fishData.fishData?.id,
                name: fishData.name || fishData.fishData?.name,
                // Spawn at saved position, clamped to current viewport.
                x: clampedX,
                y: clampedY,
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

              // Keep the collection modal open so user can add more fish
            } catch (error) {
              console.error('Error adding fish to tank:', error);
              toast('Failed to add fish to tank', true);
            }
          });

        this.loadPresetsFromState();
        this.render();
        this.panel.style.display = 'block';
        console.log('Panel should now be visible');
      } else {
        console.error('Failed to initialize panel');
      }
    } catch (error) {
      console.error('Error in NewCollectionModal.show():', error);
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

    const sorted = [...fishList].sort((a, b) => {
      const { value: valueA, isNumeric } = this.getSortValue(a, this.sortColumn!);
      const { value: valueB } = this.getSortValue(b, this.sortColumn!);

      let comparison = 0;
      if (isNumeric) {
        comparison = Number(valueA) - Number(valueB);
      } else {
        const aText = String(valueA);
        const bText = String(valueB);
        comparison = aText.localeCompare(bText);
      }

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });

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

    this.render();
  }

  private getGeneNumber(fishData: Record<string, unknown>, key: string): number {
    if (typeof fishData[key] === 'number') {
      return fishData[key] as number;
    }
    const genes = fishData.genes;
    if (genes && typeof genes === 'object' && !Array.isArray(genes)) {
      const geneValue = (genes as Record<string, unknown>)[key];
      if (typeof geneValue === 'number') {
        return geneValue;
      }
    }
    return 0;
  }

  private getGeneString(fishData: Record<string, unknown>, key: string): string {
    if (typeof fishData[key] === 'string') {
      return fishData[key] as string;
    }
    const genes = fishData.genes;
    if (genes && typeof genes === 'object' && !Array.isArray(genes)) {
      const geneValue = (genes as Record<string, unknown>)[key];
      if (typeof geneValue === 'string') {
        return geneValue;
      }
    }
    return '';
  }

  private getDateValue(input: unknown): number | null {
    if (typeof input === 'number') {
      return input;
    }
    if (typeof input === 'string') {
      const parsed = Date.parse(input);
      return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
  }

  private getSortValue(
    fish: SavedFish,
    column: string
  ): { value: string | number; isNumeric: boolean } {
    const fishData = fish.fishData as Record<string, unknown>;

    switch (column) {
      case 'name':
        return { value: fish.name?.toLowerCase() || '', isNumeric: false };
      case 'sex':
        return { value: String(fishData.sex || '').toLowerCase(), isNumeric: false };
      case 'age':
        return { value: Number(fishData.age || 0), isNumeric: true };
      case 'size':
        return { value: Number(fishData.size || 0), isNumeric: true };
      case 'speed':
        return { value: this.getGeneNumber(fishData, 'speed'), isNumeric: true };
      case 'senseGene':
        return { value: this.getGeneNumber(fishData, 'senseGene'), isNumeric: true };
      case 'hungerDrive':
        return { value: this.getGeneNumber(fishData, 'hungerDrive'), isNumeric: true };
      case 'constitution':
        return { value: this.getGeneNumber(fishData, 'constitution'), isNumeric: true };
      case 'rarityGene':
        return { value: this.getGeneNumber(fishData, 'rarityGene'), isNumeric: true };
      case 'defAffGene':
        return { value: this.getGeneNumber(fishData, 'defAffGene'), isNumeric: true };
      case 'defAffType':
        return {
          value: this.getGeneString(fishData, 'defAffType').toLowerCase(),
          isNumeric: false,
        };
      case 'colorHue':
        return { value: this.getGeneNumber(fishData, 'colorHue'), isNumeric: true };
      case 'finShape':
        return { value: this.getGeneString(fishData, 'finShape').toLowerCase(), isNumeric: false };
      case 'patternType':
        return {
          value: this.getGeneString(fishData, 'patternType').toLowerCase(),
          isNumeric: false,
        };
      case 'eyeType':
        return { value: this.getGeneString(fishData, 'eyeType').toLowerCase(), isNumeric: false };
      case 'species':
        return {
          value: String(fish.species || fishData.species || '').toLowerCase(),
          isNumeric: false,
        };
      case 'generation':
        return { value: Number(fish.generation || fishData.generation || 0), isNumeric: true };
      case 'id':
        return { value: String(fish.id || ''), isNumeric: false };
      case 'originalId':
        return { value: String(fishData.originalId || ''), isNumeric: false };
      case 'maxSize':
        return { value: Number(fishData.maxSize || 0), isNumeric: true };
      case 'favorite':
        return { value: fishData.favorite ? 1 : 0, isNumeric: true };
      case 'shiny':
        return { value: fishData.shiny ? 1 : 0, isNumeric: true };
      case 'state':
        return { value: String(fishData.state || '').toLowerCase(), isNumeric: false };
      case 'x':
        return { value: Number(fishData.x || 0), isNumeric: true };
      case 'y':
        return { value: Number(fishData.y || 0), isNumeric: true };
      case 'birthTime':
        return { value: Number(fishData.birthTime || 0), isNumeric: true };
      case 'lastSaved':
        return { value: Number(fish.lastSaved || 0), isNumeric: true };
      case 'saveDate': {
        const dateValue = this.getDateValue(fish.saveDate);
        return { value: dateValue ?? 0, isNumeric: true };
      }
      default:
        return { value: '', isNumeric: false };
    }
  }

  private getFilterState(column: string): FilterState {
    if (this.filters[column]) {
      return this.filters[column];
    }
    const def = FILTER_DEFS[column];
    if (!def) {
      this.filters[column] = { type: 'text', query: '' };
      return this.filters[column];
    }
    switch (def.type) {
      case 'set':
        this.filters[column] = { type: 'set', excluded: new Set<string>() };
        break;
      case 'number-set':
        this.filters[column] = { type: 'number-set', excluded: new Set<string>() };
        break;
      case 'number-range':
        this.filters[column] = { type: 'number-range', min: null, max: null };
        break;
      case 'text':
      default:
        this.filters[column] = { type: 'text', query: '' };
        break;
    }
    return this.filters[column];
  }

  private isFilterActive(filter: FilterState): boolean {
    if (filter.type === 'set' || filter.type === 'number-set') {
      return filter.excluded.size > 0;
    }
    if (filter.type === 'number-range') {
      return filter.min !== null || filter.max !== null;
    }
    return filter.query.trim().length > 0;
  }

  private getFilterValue(
    fish: SavedFish,
    column: string
  ): { value: string | number; isNumeric: boolean } {
    if (column === 'favorite' || column === 'shiny') {
      const fishData = fish.fishData as Record<string, unknown>;
      const key = column as 'favorite' | 'shiny';
      return { value: fishData[key] ? 'yes' : 'no', isNumeric: false };
    }
    return this.getSortValue(fish, column);
  }

  private applyFilters(fishList: SavedFish[]): SavedFish[] {
    const activeFilters = Object.entries(this.filters).filter(([, filter]) =>
      this.isFilterActive(filter)
    );
    if (activeFilters.length === 0) {
      return fishList;
    }

    return fishList.filter(fish => {
      for (const [column, filter] of activeFilters) {
        const { value, isNumeric } = this.getFilterValue(fish, column);

        if (filter.type === 'text') {
          const query = filter.query.trim().toLowerCase();
          const hay = String(value).toLowerCase();
          if (!hay.includes(query)) {
            return false;
          }
        } else if (filter.type === 'number-range') {
          if (!isNumeric) {
            return false;
          }
          const numberValue = Number(value);
          if (Number.isNaN(numberValue)) {
            return false;
          }
          if (filter.min !== null && numberValue < filter.min) {
            return false;
          }
          if (filter.max !== null && numberValue > filter.max) {
            return false;
          }
        } else if (filter.type === 'number-set') {
          const numberValue = Number(value);
          const key = Number.isNaN(numberValue) ? '' : String(Math.round(numberValue));
          if (filter.excluded.has(key)) {
            return false;
          }
        } else if (filter.type === 'set') {
          const key = String(value).toLowerCase();
          if (filter.excluded.has(key)) {
            return false;
          }
        }
      }
      return true;
    });
  }

  private renderFilterPanel(): string {
    if (!this.activeFilterColumn) {
      return `<div class="filter-panel" data-open="false"></div>`;
    }

    const column = this.activeFilterColumn;
    const def = FILTER_DEFS[column] || { type: 'text' };
    const label = COLUMN_LABELS[column] || column;
    const filter = this.getFilterState(column);

    let content = '';
    if (def.type === 'text' && filter.type === 'text') {
      content = `
        <label class="filter-label">Contains</label>
        <input class="filter-input" type="text" data-filter-input="${column}" value="${filter.query}" placeholder="Type to filter..." />
      `;
    } else if (def.type === 'number-range' && filter.type === 'number-range') {
      const minValue = filter.min !== null ? filter.min : '';
      const maxValue = filter.max !== null ? filter.max : '';
      content = `
        <div class="filter-range">
          <label class="filter-label">Min</label>
          <input class="filter-input" type="text" inputmode="numeric" data-filter-min="${column}" value="${minValue}" />
          <label class="filter-label">Max</label>
          <input class="filter-input" type="text" inputmode="numeric" data-filter-max="${column}" value="${maxValue}" />
        </div>
      `;
    } else if ((def.type === 'set' || def.type === 'number-set') && filter.type !== 'text') {
      const excluded =
        filter.type === 'set' || filter.type === 'number-set' ? filter.excluded : new Set();
      const options = def.options || [];
      content = `
        <div class="filter-grid">
          ${options
            .map(option => {
              const key = String(option).toLowerCase();
              const isExcluded = excluded.has(key);
              return `
                <button class="filter-toggle ${isExcluded ? 'is-excluded' : 'is-included'}" data-filter-toggle="${column}" data-filter-value="${key}">
                  ${option}
                </button>
              `;
            })
            .join('')}
        </div>
      `;
    }

    return `
      <div class="filter-panel" data-open="true" data-column="${column}">
        <div class="filter-panel__header">
          <div class="filter-panel__title">${label} Filter</div>
          <button class="filter-panel__close" data-filter-close>&times;</button>
        </div>
        <div class="filter-panel__content">
          ${content}
        </div>
        <div class="filter-panel__actions">
          <button class="filter-panel__reset" data-filter-reset="${column}">Reset Column</button>
        </div>
      </div>
    `;
  }

  private getCurrentPresetSnapshot(): InventoryPreset {
    return {
      id: this.selectedPresetId,
      name: '',
      filters: this.serializeFilters(),
      columnOrder: [...this.columnOrder],
      columnVisibility: { ...this.columnVisibility },
      sort: this.sortColumn ? { column: this.sortColumn, direction: this.sortDirection } : null,
    };
  }

  private isPresetDirty(preset: InventoryPreset | undefined): boolean {
    if (!preset) {
      return false;
    }
    const current = this.getCurrentPresetSnapshot();
    const normalize = (input: InventoryPreset) =>
      JSON.stringify({
        filters: this.normalizeObjectKeys(input.filters),
        columnOrder: input.columnOrder,
        columnVisibility: this.normalizeObjectKeys(input.columnVisibility),
        sort: input.sort,
      });
    return normalize(current) !== normalize(preset);
  }

  private normalizeObjectKeys<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
    return Object.keys(obj)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = obj[key];
        return acc;
      }, {});
  }

  private getVisibleColumns(): string[] {
    return this.columnOrder.filter(column => this.columnVisibility[column] !== false);
  }

  private renderHeaderCell(column: string): string {
    const def = COLUMN_DEFS[column];
    if (!def) {
      return '';
    }
    const sortMark =
      def.sortable && this.sortColumn === column ? (this.sortDirection === 'asc' ? '↑' : '↓') : '';
    const filterActive = this.isFilterActive(this.getFilterState(column));
    const activeClass = filterActive ? 'filter-active' : '';
    const sortableClass = def.sortable ? 'sortable' : '';
    const sortAttr = def.sortable ? `data-column="${column}"` : '';
    const filterButton = def.filterable
      ? `<button class="filter-btn" data-filter="${column}" title="Filter ${def.label}">f</button>`
      : '<span></span>';
    const headerLines = def.label.split(' ').filter(Boolean);
    const headerLabel = headerLines
      .map(line => `<span class="header-title__line">${line}</span>`)
      .join('');
    const dropClass = this.dragOverColumn === column ? 'drop-target' : '';
    return `
      <th style="${def.width}" class="${sortableClass} ${activeClass} ${dropClass}" ${sortAttr} data-drop-column="${column}">
        <div class="header-controls">
          <span class="header-controls__left">${filterButton}</span>
          <span class="header-controls__center">
            <span class="drag-handle" data-drag-column="${column}" title="Move ${def.label}" draggable="true">M</span>
          </span>
          <span class="header-controls__right">
            <button class="hide-btn" data-hide="${column}" title="Hide ${def.label}">H</button>
          </span>
        </div>
        <span class="header-title">${headerLabel} ${sortMark}</span>
      </th>
    `;
  }

  private renderHiddenColumns(): string {
    const hidden = this.columnOrder.filter(column => this.columnVisibility[column] === false);
    if (hidden.length === 0) {
      return '';
    }
    return `
      <div class="hidden-columns">
        <span class="hidden-columns__label">Hidden:</span>
        ${hidden
          .map(column => {
            const label = COLUMN_DEFS[column]?.label || column;
            return `<button class="unhide-btn" data-unhide="${column}" title="Show ${label}">${label}</button>`;
          })
          .join('')}
      </div>
    `;
  }

  private loadPresetsFromState(): void {
    const state = this.getGameState()?.getState();
    const fallback = storageManager.getCurrentData();

    const presetsSource = Array.isArray(state?.inventoryPresets)
      ? state!.inventoryPresets
      : Array.isArray(fallback.inventoryPresets)
        ? fallback.inventoryPresets
        : [];

    this.presets = this.ensureDefaultPreset(presetsSource);
    this.selectedPresetId =
      typeof state?.selectedInventoryPresetId === 'string'
        ? state!.selectedInventoryPresetId
        : typeof fallback.selectedInventoryPresetId === 'string'
          ? fallback.selectedInventoryPresetId
          : 'preset-all';

    const activePreset =
      this.presets.find(preset => preset.id === this.selectedPresetId) || this.presets[0];
    if (activePreset) {
      this.applyPreset(activePreset);
    }
  }

  private ensureDefaultPreset(presets: InventoryPreset[]): InventoryPreset[] {
    const normalized = presets.map(preset => ({ ...preset }));
    const hasDefault = normalized.some(preset => preset.isDefault || preset.id === 'preset-all');
    if (!hasDefault) {
      normalized.unshift({
        id: 'preset-all',
        name: 'All',
        isDefault: true,
        filters: {},
        columnOrder: [...DEFAULT_COLUMN_ORDER],
        columnVisibility: buildDefaultColumnVisibility(),
        sort: null,
      });
    }
    return normalized;
  }

  private applyPreset(preset: InventoryPreset): void {
    this.selectedPresetId = preset.id;
    this.activeFilterColumn = null;
    this.filters = {};

    Object.entries(preset.filters || {}).forEach(([key, rule]) => {
      this.filters[key] = this.deserializeFilterRule(rule);
    });

    this.columnOrder =
      Array.isArray(preset.columnOrder) && preset.columnOrder.length > 0
        ? [...preset.columnOrder]
        : [...DEFAULT_COLUMN_ORDER];
    DEFAULT_COLUMN_ORDER.forEach(column => {
      if (!this.columnOrder.includes(column)) {
        this.columnOrder.push(column);
      }
    });
    this.columnVisibility =
      preset.columnVisibility && Object.keys(preset.columnVisibility).length > 0
        ? { ...preset.columnVisibility }
        : buildDefaultColumnVisibility();
    DEFAULT_COLUMN_ORDER.forEach(column => {
      if (this.columnVisibility[column] === undefined) {
        this.columnVisibility[column] = true;
      }
    });

    if (preset.sort && preset.sort.column) {
      this.sortColumn = preset.sort.column;
      this.sortDirection = preset.sort.direction === 'desc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = null;
    }
  }

  private deserializeFilterRule(rule: InventoryFilterRule): FilterState {
    if (rule.type === 'set' || rule.type === 'number-set') {
      return { type: rule.type, excluded: new Set(rule.excluded.map(v => v.toLowerCase())) };
    }
    if (rule.type === 'number-range') {
      return { type: 'number-range', min: rule.min ?? null, max: rule.max ?? null };
    }
    return { type: 'text', query: rule.query || '' };
  }

  private serializeFilters(): Record<string, InventoryFilterRule> {
    const result: Record<string, InventoryFilterRule> = {};
    for (const [key, filter] of Object.entries(this.filters)) {
      if (!this.isFilterActive(filter)) {
        continue;
      }
      if (filter.type === 'set' || filter.type === 'number-set') {
        result[key] = {
          type: filter.type,
          excluded: Array.from(filter.excluded),
        };
      } else if (filter.type === 'number-range') {
        result[key] = {
          type: 'number-range',
          min: filter.min,
          max: filter.max,
        };
      } else if (filter.type === 'text') {
        result[key] = {
          type: 'text',
          query: filter.query,
        };
      }
    }
    return result;
  }

  private setSelectedPreset(id: string): void {
    const preset = this.presets.find(item => item.id === id);
    if (!preset) {
      return;
    }
    this.applyPreset(preset);
    this.savePresetsToState();
  }

  private savePresetsToState(): void {
    gameState.updateState({
      inventoryPresets: this.presets,
      selectedInventoryPresetId: this.selectedPresetId,
    });
  }

  private createPreset(name: string): InventoryPreset {
    return {
      id: `preset-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      filters: this.serializeFilters(),
      columnOrder: [...this.columnOrder],
      columnVisibility: { ...this.columnVisibility },
      sort: this.sortColumn ? { column: this.sortColumn, direction: this.sortDirection } : null,
    };
  }

  private moveColumn(source: string, target: string): void {
    if (source === target) {
      return;
    }
    const order = [...this.columnOrder];
    const sourceIndex = order.indexOf(source);
    const targetIndex = order.indexOf(target);
    if (sourceIndex === -1 || targetIndex === -1) {
      return;
    }
    order.splice(sourceIndex, 1);
    const insertIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
    order.splice(insertIndex, 0, source);
    this.columnOrder = order;
  }

  private renderAndRestoreFocus(selector: string, caretPos: number | null): void {
    this.render();
    requestAnimationFrame(() => {
      const input = this.panel?.querySelector(selector) as HTMLInputElement | null;
      if (!input) return;
      input.focus();
      if (caretPos !== null) {
        const pos = Math.min(caretPos, input.value.length);
        try {
          input.setSelectionRange(pos, pos);
        } catch {
          // Some input types don't support selection ranges.
        }
      }
    });
  }

  private focusFilterInput(column: string): void {
    const def = FILTER_DEFS[column];
    if (!def) return;
    requestAnimationFrame(() => {
      if (!this.panel) return;
      if (def.type === 'text') {
        const input = this.panel.querySelector(
          `[data-filter-input="${column}"]`
        ) as HTMLInputElement | null;
        input?.focus();
        return;
      }
      if (def.type === 'number-range') {
        const input = this.panel.querySelector(
          `[data-filter-min="${column}"]`
        ) as HTMLInputElement | null;
        input?.focus();
      }
    });
  }

  private setDropTarget(column: string | null): void {
    if (this.dragOverColumn === column) {
      return;
    }
    this.dragOverColumn = column;
    this.panel?.querySelectorAll('th[data-drop-column]').forEach(header => {
      const headerColumn = header.getAttribute('data-drop-column');
      if (headerColumn && headerColumn === column) {
        header.classList.add('drop-target');
      } else {
        header.classList.remove('drop-target');
      }
    });
  }

  private render(): void {
    if (!this.panel) {
      console.error('Cannot render: panel element not found');
      return;
    }

    console.log('Rendering new collection modal...');
    const savedFish = this.getSavedFish();
    console.log(`Total fish to render: ${savedFish.length}`);

    const filteredFish = this.applyFilters(savedFish);
    const sortedFish = this.sortFishCollection(filteredFish);
    console.log(`Sorted ${sortedFish.length} fish for display`);
    const activePreset = this.presets.find(preset => preset.id === this.selectedPresetId);
    const presetName = activePreset?.name || 'All';
    const isPresetDirty = this.isPresetDirty(activePreset);
    const presetSelectValue = isPresetDirty ? 'preset-custom' : this.selectedPresetId;
    const visibleColumns = this.getVisibleColumns();
    const totalColumns = visibleColumns.length + 2;
    const columnHeaders = visibleColumns.map(column => this.renderHeaderCell(column)).join('');
    const hiddenColumns = this.renderHiddenColumns();

    this.panel.innerHTML = `
      <style>
        .inventory-modal {
          position: fixed;
          inset: 0;
          background: rgba(6, 12, 18, 0.96);
          z-index: 1001;
          padding: 20px 24px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          color: #fff;
          pointer-events: auto;
        }

        .inventory-modal__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .inventory-modal__heading {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .inventory-modal__title {
          margin: 0;
          font-size: 20px;
        }

        .preset-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }

        .preset-controls select,
        .preset-controls input {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          padding: 6px 8px;
          border-radius: 6px;
          font-size: 12px;
        }

        .preset-controls select option {
          background: #0b2230;
          color: #fff;
        }

        .preset-controls button {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
        }

        .hidden-columns {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          align-items: center;
          margin-bottom: 10px;
        }

        .hidden-columns__label {
          font-size: 12px;
          color: #bbb;
        }

        .unhide-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          cursor: pointer;
        }

        .inventory-modal__close {
          background: none;
          border: none;
          color: #fff;
          font-size: 26px;
          cursor: pointer;
        }

        .inventory-modal__content {
          flex: 1;
          display: flex;
          flex-direction: column;
          margin-top: 12px;
          min-height: 0;
          pointer-events: auto;
        }

        .filter-panel {
          background: rgba(12, 20, 28, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 12px;
          display: none;
          pointer-events: auto;
        }

        .filter-panel[data-open="true"] {
          display: block;
        }

        .filter-panel__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .filter-panel__title {
          font-weight: 600;
        }

        .filter-panel__close {
          background: none;
          border: none;
          color: #fff;
          font-size: 18px;
          cursor: pointer;
        }

        .filter-panel__content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .filter-panel__actions {
          margin-top: 10px;
          display: flex;
          justify-content: flex-end;
        }

        .filter-panel__reset {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          padding: 6px 10px;
          border-radius: 6px;
          cursor: pointer;
        }

        .filter-label {
          font-size: 12px;
          color: #ccc;
        }

        .filter-input {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          color: #fff;
          padding: 6px 8px;
          font-size: 13px;
        }

        .filter-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .filter-toggle {
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          padding: 6px 10px;
          cursor: pointer;
          background: rgba(60, 200, 90, 0.45);
          color: #f3fff3;
        }

        .filter-toggle.is-excluded {
          background: rgba(235, 80, 80, 0.5);
          color: #fff1f1;
        }

        .filter-range {
          display: grid;
          grid-template-columns: auto 1fr auto 1fr;
          gap: 8px;
          align-items: center;
        }

        .fish-collection-table {
          width: max-content;
          display: inline-table;
          min-width: 0;
          border-collapse: collapse;
          font-size: 13px;
          margin-top: 10px;
          table-layout: fixed;
        }
        
        .fish-collection-table th {
          text-align: left;
          padding: 4px 3px;
          background: rgba(12, 18, 26, 0.95);
          border-bottom: 2px solid rgba(255,255,255,0.1);
          font-weight: 600;
          color: #ccc;
          position: sticky;
          top: 0;
          user-select: none;
          z-index: 2;
        }

        .fish-collection-table th.filter-active {
          background: rgba(255, 214, 102, 0.35);
          color: #fff4cc;
        }

        .header-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1px;
          width: fit-content;
          margin: 0 auto 2px;
        }

        .header-controls__left,
        .header-controls__center,
        .header-controls__right {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0;
          padding: 0;
        }

        .header-title {
          display: block;
          font-size: 12px;
          color: #ddd;
          line-height: 1.1;
          word-break: normal;
        }

        .header-title__line {
          display: block;
        }

        .filter-btn,
        .hide-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          border-radius: 4px;
          padding: 0;
          width: 18px;
          height: 18px;
          line-height: 18px;
          font-size: 11px;
          cursor: pointer;
        }

        .drag-handle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          padding: 0;
          width: 18px;
          height: 18px;
          line-height: 18px;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #ddd;
          cursor: grab;
        }
        
        .sortable {
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .sortable:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .fish-collection-table td {
          padding: 4px 3px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          vertical-align: middle;
        }

        .fish-collection-table th,
        .fish-collection-table td {
          box-sizing: border-box;
          border-right: 1px solid rgba(70, 140, 255, 0.45);
        }

        .fish-collection-table th:last-child,
        .fish-collection-table td:last-child {
          border-right: none;
        }

        .fish-collection-table th.drop-target {
          box-shadow: inset 4px 0 0 rgba(90, 170, 255, 0.9);
        }
        
        .fish-row:hover {
          background: rgba(255,255,255,0.05);
        }

        .date-cell {
          display: inline-flex;
          flex-direction: column;
          line-height: 1.1;
        }

        .date-cell__line {
          display: block;
        }

        .favorite-icon {
          color: #ffd45c;
          margin-left: 4px;
        }

        .shiny-icon {
          margin-left: 4px;
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
      <div class="inventory-modal__header">
        <div class="inventory-modal__heading">
          <h3 class="inventory-modal__title">My Fish Collection <span style="font-size: 0.8em; opacity: 0.8;">(${filteredFish.length}/${savedFish.length} fish)</span></h3>
          <div class="preset-controls">
            <label>Preset</label>
            <select id="presetSelect">
              ${isPresetDirty ? `<option value="preset-custom" selected>Custom</option>` : ''}
              ${this.presets
                .map(
                  preset =>
                    `<option value="${preset.id}" ${
                      preset.id === presetSelectValue ? 'selected' : ''
                    }>${preset.name}</option>`
                )
                .join('')}
            </select>
            <input id="presetName" type="text" placeholder="Preset name" value="${presetName}" />
            <button id="savePreset">Save</button>
            <button id="renamePreset">Rename</button>
            <button id="deletePreset">Delete</button>
          </div>
        </div>
        <button id="closeCollection" class="inventory-modal__close" aria-label="Close">&times;</button>
      </div>
      <style>
        .table-wrapper {
          max-height: 70vh;
          overflow: auto;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 4px;
        }
        
        .fish-collection-table {
          width: max-content;
          display: inline-table;
          min-width: 0;
          table-layout: fixed;
        }
        
        .fish-collection-table th,
        .fish-collection-table td {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .fish-collection-table th {
          white-space: normal;
          overflow: visible;
          text-overflow: clip;
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
      <div class="inventory-modal__content">
        ${this.renderFilterPanel()}
        ${hiddenColumns}
        <div class="table-wrapper">
        <table class="fish-collection-table">
          <thead>
            <tr>
              <th style="width: 40px;">+</th>
              ${columnHeaders}
              <th style="width: 40px;">×</th>
            </tr>
          </thead>
          <tbody>
            ${
              sortedFish.length > 0
                ? sortedFish.map(fish => this.createFishCard(fish, visibleColumns)).join('')
                : `<tr><td colspan="${totalColumns}" class="no-fish">No fish in your collection yet. Select a fish and click "Save to Collection".</td></tr>`
            }
          </tbody>
        </table>
        </div>
        <div class="collection-actions">
          <button id="closeCollectionBtn">Close</button>
        </div>
      </div>
    `;

    // Add event listeners
    this.panel?.querySelector('#closeCollection')?.addEventListener('click', () => this.hide());
    this.panel?.querySelector('#closeCollectionBtn')?.addEventListener('click', () => this.hide());

    // Add sort handlers to column headers
    this.panel?.querySelectorAll('.sortable').forEach(header => {
      header.addEventListener('click', e => {
        const target = e.target as HTMLElement;
        if (
          target.closest('.filter-btn') ||
          target.closest('.hide-btn') ||
          target.closest('.drag-handle')
        ) {
          return;
        }
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

    this.panel?.querySelectorAll('.filter-btn').forEach(button => {
      button.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        const column = (e.currentTarget as HTMLElement).getAttribute('data-filter');
        if (column) {
          this.activeFilterColumn = column;
          this.render();
          this.focusFilterInput(column);
        }
      });
    });

    this.panel?.querySelectorAll('.drag-handle').forEach(handle => {
      handle.addEventListener('dragstart', e => {
        const column = (e.currentTarget as HTMLElement).getAttribute('data-drag-column');
        if (!column) return;
        this.draggingColumn = column;
        this.setDropTarget(null);
        e.dataTransfer?.setData('text/plain', column);
      });
      handle.addEventListener('dragend', () => {
        this.draggingColumn = null;
        this.setDropTarget(null);
      });
    });

    this.panel?.querySelectorAll('th[data-drop-column]').forEach(header => {
      header.addEventListener('dragover', e => {
        e.preventDefault();
        const targetColumn = (e.currentTarget as HTMLElement).getAttribute('data-drop-column');
        if (targetColumn) {
          this.setDropTarget(targetColumn);
        }
      });
      header.addEventListener('drop', e => {
        e.preventDefault();
        const targetColumn = (e.currentTarget as HTMLElement).getAttribute('data-drop-column');
        const sourceColumn = this.draggingColumn || e.dataTransfer?.getData('text/plain') || '';
        if (targetColumn && sourceColumn) {
          this.moveColumn(sourceColumn, targetColumn);
          this.draggingColumn = null;
          this.setDropTarget(null);
          this.render();
        }
      });
    });

    const presetSelect = this.panel?.querySelector('#presetSelect') as HTMLSelectElement | null;
    if (presetSelect) {
      presetSelect.addEventListener('change', () => {
        if (presetSelect.value === 'preset-custom') {
          this.render();
          return;
        }
        this.setSelectedPreset(presetSelect.value);
        this.render();
      });
    }

    const presetNameInput = this.panel?.querySelector('#presetName') as HTMLInputElement | null;
    const savePresetBtn = this.panel?.querySelector('#savePreset') as HTMLButtonElement | null;
    const renamePresetBtn = this.panel?.querySelector('#renamePreset') as HTMLButtonElement | null;
    const deletePresetBtn = this.panel?.querySelector('#deletePreset') as HTMLButtonElement | null;

    if (savePresetBtn) {
      savePresetBtn.addEventListener('click', () => {
        const name = presetNameInput?.value.trim() || '';
        if (!name) {
          toast('Enter a preset name', true);
          return;
        }
        const existingIndex = this.presets.findIndex(
          preset => preset.name.toLowerCase() === name.toLowerCase()
        );
        if (existingIndex >= 0) {
          const existing = this.presets[existingIndex];
          if (existing.isDefault || existing.id === 'preset-all') {
            toast('Default preset cannot be overwritten', true);
            return;
          }
          this.presets[existingIndex] = {
            ...existing,
            name: existing.name,
            filters: this.serializeFilters(),
            columnOrder: [...this.columnOrder],
            columnVisibility: { ...this.columnVisibility },
            sort: this.sortColumn
              ? { column: this.sortColumn, direction: this.sortDirection }
              : null,
          };
          this.selectedPresetId = existing.id;
        } else {
          const newPreset = this.createPreset(name);
          this.presets.push(newPreset);
          this.selectedPresetId = newPreset.id;
        }
        this.savePresetsToState();
        this.render();
      });
    }

    if (renamePresetBtn) {
      renamePresetBtn.addEventListener('click', () => {
        const name = presetNameInput?.value.trim() || '';
        const preset = this.presets.find(item => item.id === this.selectedPresetId);
        if (!preset) {
          toast('No preset selected', true);
          return;
        }
        if (preset.isDefault || preset.id === 'preset-all') {
          toast('Default preset cannot be renamed', true);
          return;
        }
        if (!name) {
          toast('Enter a preset name', true);
          return;
        }
        preset.name = name;
        this.savePresetsToState();
        this.render();
      });
    }

    if (deletePresetBtn) {
      deletePresetBtn.addEventListener('click', () => {
        const preset = this.presets.find(item => item.id === this.selectedPresetId);
        if (!preset) {
          toast('No preset selected', true);
          return;
        }
        if (preset.isDefault || preset.id === 'preset-all') {
          toast('Default preset cannot be deleted', true);
          return;
        }
        this.presets = this.presets.filter(item => item.id !== preset.id);
        this.selectedPresetId = 'preset-all';
        this.setSelectedPreset('preset-all');
        this.savePresetsToState();
        this.render();
      });
    }

    // Add event listeners for select buttons
    savedFish.forEach(fish => {
      const selectBtn = this.panel?.querySelector(
        `#select-fish-${fish.id}`
      ) as HTMLButtonElement | null;
      if (selectBtn) {
        selectBtn.addEventListener('click', () => {
          if (this.onSelectFish) {
            this.onSelectFish(fish);
          }
        });
      }
    });
  }

  private createFishCard(fish: SavedFish, visibleColumns: string[]): string {
    const fishData = fish.fishData as Record<string, unknown>;
    const fishName = fish.name || 'Unnamed Fish';

    const formatNumber = (value: number | undefined) =>
      typeof value === 'number' ? Math.floor(value).toString() : '—';
    const formatText = (value: unknown) => (value ? String(value) : '—');
    const formatTimestamp = (value: unknown, isSeconds: boolean) => {
      if (value === undefined || value === null || value === '') {
        return '—';
      }
      let ms: number;
      if (typeof value === 'string') {
        const parsed = Date.parse(value);
        if (Number.isNaN(parsed)) {
          return '—';
        }
        ms = parsed;
      } else {
        const numberValue = typeof value === 'number' ? value : Number(value);
        if (Number.isNaN(numberValue) || numberValue <= 0) {
          return '—';
        }
        ms = isSeconds ? numberValue * 1000 : numberValue;
      }
      const date = new Date(ms);
      if (Number.isNaN(date.getTime())) {
        return '—';
      }
      const yyyy = date.getFullYear().toString().padStart(4, '0');
      const mm = (date.getMonth() + 1).toString().padStart(2, '0');
      const dd = date.getDate().toString().padStart(2, '0');
      const hh = date.getHours().toString().padStart(2, '0');
      const min = date.getMinutes().toString().padStart(2, '0');
      const ss = date.getSeconds().toString().padStart(2, '0');
      return `<span class="date-cell"><span class="date-cell__line">${yyyy}${mm}${dd}</span><span class="date-cell__line">${hh}:${min}:${ss}</span></span>`;
    };

    const speed = this.getGeneNumber(fishData, 'speed');
    const senseGene = this.getGeneNumber(fishData, 'senseGene');
    const hungerDrive = this.getGeneNumber(fishData, 'hungerDrive');
    const constitution = this.getGeneNumber(fishData, 'constitution');
    const rarityGene = this.getGeneNumber(fishData, 'rarityGene');
    const defAffGene = this.getGeneNumber(fishData, 'defAffGene');
    const defAffType = this.getGeneString(fishData, 'defAffType');
    const colorHue = this.getGeneNumber(fishData, 'colorHue');
    const finShape = this.getGeneString(fishData, 'finShape');
    const patternType = this.getGeneString(fishData, 'patternType');
    const eyeType = this.getGeneString(fishData, 'eyeType');

    // Create a tiny color swatch
    const colorSwatch = `<span class="color-swatch" style="background-color: hsl(${colorHue}, 80%, 50%)" title="Hue ${colorHue}°"></span>`;

    const nameCell = `
      <div class="fish-name-cell" data-fish-id="${fish.id}">
        <span class="name editable" data-fish-id="${fish.id}" title="Click to rename">${fishName}</span>
      </div>
    `;

    const columnValues: Record<string, string> = {
      name: nameCell,
      sex: formatText(fishData.sex),
      age: formatNumber(fishData.age as number),
      size: formatNumber(fishData.size as number),
      speed: formatNumber(speed),
      senseGene: formatNumber(senseGene),
      hungerDrive: formatNumber(hungerDrive),
      constitution: formatNumber(constitution),
      rarityGene: formatNumber(rarityGene),
      defAffGene: formatNumber(defAffGene),
      defAffType: defAffType ? formatText(defAffType) : '—',
      colorHue: `${formatNumber(colorHue)}° ${colorSwatch}`,
      finShape: finShape ? getTailShapeDisplayName(finShape as TailShape) : '—',
      patternType: patternType || '—',
      eyeType: eyeType || '—',
      species: formatText(fish.species || fishData.species),
      generation: formatNumber((fish.generation || fishData.generation) as number),
      id: formatText(fish.id),
      originalId: formatText(fishData.originalId),
      maxSize: formatNumber(fishData.maxSize as number),
      favorite: fishData.favorite ? 'Yes <span class="favorite-icon">★</span>' : 'No',
      shiny: fishData.shiny ? 'Yes <span class="shiny-icon">✨</span>' : 'No',
      state: formatText(fishData.state),
      x: formatNumber(fishData.x as number),
      y: formatNumber(fishData.y as number),
      birthTime: formatTimestamp(fishData.birthTime, true),
      lastSaved: formatTimestamp(fish.lastSaved, false),
      saveDate: formatTimestamp(fish.saveDate, false),
    };

    const cells = visibleColumns
      .map(column => {
        const value = columnValues[column] ?? '—';
        const title = column === 'id' && fish.id ? ` title="${fish.id}"` : '';
        return `<td class="fish-${column}"${title}>${value}</td>`;
      })
      .join('');

    return `
      <tr class="fish-row" data-id="${fish.id}">
        <td class="fish-add">
          <button class="btn-add" id="select-fish-${fish.id}" title="Add to tank">+</button>
        </td>
        ${cells}
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
      console.log('Getting saved fish from game state...');
      const gameState = this.getGameState();

      if (!gameState) {
        console.log('No gameState available, using storage manager cache');
        const currentData = storageManager.getCurrentData();
        return Array.isArray(currentData.fishCollection) ? currentData.fishCollection : [];
      }

      const state = gameState.getState();
      console.log('Current game state:', state);

      // Check for fish collection in the root of the state
      if (state?.fishCollection) {
        const fish = Array.isArray(state.fishCollection) ? state.fishCollection : [];
        console.log(`Retrieved ${fish.length} fish from gameState.fishCollection`);
        return fish;
      }

      // Fallback: Check if fish are stored in the gameState object directly
      if (state?.gameState?.fishCollection) {
        const fish = Array.isArray(state.gameState.fishCollection)
          ? state.gameState.fishCollection
          : [];
        console.log(`Retrieved ${fish.length} fish from gameState.gameState.fishCollection`);
        return fish;
      }

      console.log('No fish collection found in gameState');
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
    console.log('[NewCollectionModal] Starting to spawn fish with data:', fishData);

    try {
      // Import fish module dynamically
      console.log('[NewCollectionModal] Importing fish module...');
      const fishModule = await import('../entities/fish');
      const targetId = fishData.id || fishData.fishData?.id;
      if (
        targetId &&
        (fishModule.hasFishInTank?.(targetId) || this.isFishAlreadyInTank(targetId))
      ) {
        toast('Fish already in tank', true);
        return false;
      }

      console.log('[NewCollectionModal] Creating fish with position and state...');
      const savedX = Number(fishData.fishData?.x ?? fishData.x);
      const savedY = Number(fishData.fishData?.y ?? fishData.y);
      const viewportW = Math.max(0, window.innerWidth);
      const viewportH = Math.max(0, window.innerHeight);
      const hasSavedPos = Number.isFinite(savedX) && Number.isFinite(savedY);
      const fallbackX = viewportW / 2;
      const fallbackY = viewportH / 2;
      const clampedX = hasSavedPos ? Math.min(Math.max(savedX, 0), viewportW) : fallbackX;
      const clampedY = hasSavedPos ? Math.min(Math.max(savedY, 0), viewportH) : fallbackY;
      const fishConfig = {
        ...fishData,
        // Use saved position when available, clamped to current viewport.
        x: clampedX,
        y: clampedY,
        // Reset state
        _mateId: null,
        _breedCd: 0,
        _ritualTimer: 0,
        state: 'wander',
      };

      console.log('[NewCollectionModal] Calling makeFish with config:', fishConfig);
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
          '[NewCollectionModal] Failed to create fish - invalid fish object returned:',
          newFish
        );
        throw new Error('Failed to create fish - invalid fish object returned');
      }

      console.log(`[NewCollectionModal] Successfully created fish with ID: ${newFish.id}`);

      // Verify the fish was added to the tank
      const { gameState } = await import('../state/GameState');
      const state = gameState.getState();
      const fishInTank = state.fishInTank || [];
      console.log(`[NewCollectionModal] Current fish in tank:`, fishInTank);

      if (!fishInTank.includes(newFish.id)) {
        console.warn(`[NewCollectionModal] Fish ${newFish.id} not found in tank after creation`);
      } else {
        console.log(`[NewCollectionModal] Fish ${newFish.id} successfully added to tank`);
      }

      // Show success message
      toast('Fish added to tank!');

      return true;
    } catch (error) {
      console.error('[NewCollectionModal] Error spawning fish:', error);
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
          x: 0, // Reset position
          y: 0,
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

// Create and export a singleton instance
const newCollectionModal = new NewCollectionModal();

// Make it globally available
if (typeof window !== 'undefined') {
  (window as { newCollectionModal?: NewCollectionModal }).newCollectionModal = newCollectionModal;
}

export { newCollectionModal, NewCollectionModal };
