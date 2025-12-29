import type { GameSaveData, InventoryPreset, InventoryFilterRule } from './localStorageManager';

/** Default game state for new players */
const DEFAULT_INVENTORY_PRESET: InventoryPreset = {
  id: 'preset-all',
  name: 'All',
  isDefault: true,
  filters: {},
  columnOrder: [],
  columnVisibility: {},
  sort: null,
};

const DECOR_RADIUS_BY_SIZE = {
  s: 30,
  m: 50,
  l: 80,
} as const;
const DECOR_TYPES = new Set(['plant', 'coral', 'rock', 'chest']);
const DECOR_SIZES = new Set(['s', 'm', 'l']);

export const DEFAULT_SAVE_DATA: GameSaveData = {
  version: '1.0.0',
  lastSaved: Date.now(),
  gameState: {
    gameTime: 0,
    currentScene: 'mainMenu',
    score: 0,
  },
  settings: {
    volume: 0.7,
    sfxMuted: false,
    musicMuted: false,
    musicTrack: 'default',
    theme: 'day',
    uiScale: 1.0,
  },
  fish: [],
  fishCollection: [],
  tankFish: [],
  fishInTank: [],
  fishInTankOriginalIds: [],
  inventoryPresets: [DEFAULT_INVENTORY_PRESET],
  selectedInventoryPresetId: 'preset-all',
  tank: {
    background: 'default',
    decorations: [],
  },
  progress: {
    unlocked: ['basic_decor'],
    flags: {},
  },
};

type UnknownRecord = Record<string, unknown>;

/**
 * Validates and transforms game data to ensure it matches the current expected format.
 * This function should be called both when loading data from storage and before saving.
 *
 * @template T The expected return type (defaults to GameSaveData)
 * @param {any} data - The game data to validate and transform
 * @param {number} [timestamp=Math.floor(Date.now() / 1000)] - Optional timestamp in seconds. Defaults to current time.
 * @returns {T} A new, validated game data object matching the specified type
 * @throws {Error} If the input data is invalid or cannot be transformed
 */
export function validateAndTransformGameData<T = GameSaveData>(
  data: unknown,
  timestamp: number = Math.floor(Date.now() / 1000)
): T {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid game data: must be an object');
  }

  // Start with a shallow copy to avoid mutating the input
  const validated: UnknownRecord = { ...(data as UnknownRecord) };

  // Ensure required top-level fields exist
  if (typeof validated.version !== 'string') {
    validated.version = '1.0.0';
  }

  // Transform and validate game state
  if (!validated.gameState || typeof validated.gameState !== 'object') {
    validated.gameState = {};
  }

  // Ensure gameTime is a positive number
  if (typeof validated.gameState.gameTime !== 'number' || validated.gameState.gameTime < 0) {
    validated.gameState.gameTime = 0;
  }

  // Ensure currentScene is a non-empty string
  if (typeof validated.gameState.currentScene !== 'string' || !validated.gameState.currentScene) {
    validated.gameState.currentScene = 'mainMenu';
  }

  // Ensure score is a non-negative number
  if (typeof validated.gameState.score !== 'number' || validated.gameState.score < 0) {
    validated.gameState.score = 0;
  }

  // Transform and validate fish data
  if (Array.isArray(validated.fish)) {
    validated.fish = validated.fish.map((fish: FishData) =>
      validateAndTransformFish(fish, timestamp)
    );
  } else {
    validated.fish = [];
  }

  // Transform and validate fish collection data
  if (Array.isArray(validated.fishCollection)) {
    validated.fishCollection = validated.fishCollection
      .map((item: FishCollectionItem) => validateAndTransformFishCollectionItem(item, timestamp))
      .filter(Boolean);
  } else {
    validated.fishCollection = [];
  }

  // Transform and validate tank fish data
  if (Array.isArray(validated.tankFish)) {
    validated.tankFish = validated.tankFish
      .map((fish: FishData) => validateAndTransformFish(fish, timestamp))
      .filter(Boolean);
  } else {
    validated.tankFish = [];
  }

  if (!Array.isArray(validated.fishInTank)) {
    validated.fishInTank = [];
  }

  if (!Array.isArray(validated.fishInTankOriginalIds)) {
    validated.fishInTankOriginalIds = [];
  }

  // Inventory preset validation
  if (!Array.isArray(validated.inventoryPresets)) {
    validated.inventoryPresets = [DEFAULT_INVENTORY_PRESET];
  } else {
    validated.inventoryPresets = validateInventoryPresets(validated.inventoryPresets);
  }

  if (
    typeof validated.selectedInventoryPresetId !== 'string' ||
    !validated.inventoryPresets.some(preset => preset.id === validated.selectedInventoryPresetId)
  ) {
    validated.selectedInventoryPresetId = DEFAULT_INVENTORY_PRESET.id;
  }

  // Transform and validate tank data
  if (!validated.tank || typeof validated.tank !== 'object') {
    validated.tank = { background: 'default', decorations: [] };
  }

  if (!Array.isArray(validated.tank.decorations)) {
    validated.tank.decorations = [];
  } else {
    validated.tank.decorations = validated.tank.decorations
      .map(decor => normalizeDecorItem(decor))
      .filter(Boolean);
  }

  // Transform and validate progress
  if (!validated.progress || typeof validated.progress !== 'object') {
    validated.progress = { unlocked: [], flags: {} };
  }

  if (!Array.isArray(validated.progress.unlocked)) {
    validated.progress.unlocked = [];
  }

  if (!validated.progress.flags || typeof validated.progress.flags !== 'object') {
    validated.progress.flags = {};
  }

  // Update last modified timestamp
  validated.lastSaved = timestamp;

  return validated as unknown as T;
}

function normalizeDecorItem(decor: unknown) {
  if (!decor || typeof decor !== 'object') {
    return null;
  }
  const item = decor as UnknownRecord;
  const size = typeof item.size === 'string' && DECOR_SIZES.has(item.size) ? item.size : 'm';
  const type = typeof item.type === 'string' && DECOR_TYPES.has(item.type) ? item.type : 'plant';
  const r =
    typeof item.r === 'number' && Number.isFinite(item.r) ? item.r : DECOR_RADIUS_BY_SIZE[size];
  return {
    id:
      typeof item.id === 'string' && item.id
        ? item.id
        : `decor-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    x: typeof item.x === 'number' && Number.isFinite(item.x) ? item.x : 0,
    y: typeof item.y === 'number' && Number.isFinite(item.y) ? item.y : 0,
    r,
    size,
  };
}

/**
 * Interface for fish gene data structure
 */
interface FishGenes {
  senseGene?: number;
  speed?: number;
  hungerDrive?: number;
  rarityGene?: number;
  constitution?: number;
  colorHue?: number;
  pattern?: string;
  finType?: string;
  eyeType?: string;
  [key: string]: unknown; // For backward compatibility with additional properties
}

/**
 * Interface for fish data structure
 */
interface FishData {
  id?: string;
  name?: string;
  species?: string;
  sex?: 'M' | 'F';
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  dir?: number;
  size?: number;
  maxSize?: number;
  birthSize?: number;
  birthTime?: number;
  age?: number;
  state?: string;
  dead?: boolean;
  shiny?: boolean;
  favorite?: boolean;
  genes?: FishGenes;
  [key: string]: unknown; // For backward compatibility with additional properties
}

/**
 * Interface for fish collection item structure
 */
interface FishCollectionItem {
  id?: string;
  fishData?: FishData;
  lastSaved?: number;
  timestamp?: number;
  name?: string;
  saveDate?: string;
  species?: string;
  [key: string]: unknown;
}

/**
 * Validates and transforms a single fish object to ensure it matches the expected structure.
 * Handles migration of legacy formats, sets defaults, and ensures all values are within valid ranges.
 *
 * @param {any} fish - The fish data to validate and transform
 * @param {number} timestamp - Current timestamp in seconds for age calculations
 * @returns {FishData | null} Transformed fish object or null if fish is invalid or dead
 */
function validateAndTransformFish(fish: unknown, timestamp: number): FishData | null {
  // If fish is invalid, return a default fish
  if (!fish || typeof fish !== 'object' || Array.isArray(fish)) {
    const defaultFish = createDefaultFish();
    // Ensure the default fish matches our FishData type
    return {
      ...defaultFish,
      sex: defaultFish.sex === 'M' || defaultFish.sex === 'F' ? defaultFish.sex : 'M',
      genes: defaultFish.genes || {},
    };
  }

  // Type assertion for the input fish object
  const inputFish = fish as Partial<FishData>;

  // Handle legacy fish format (pre-gene system)
  let fishWithLegacyCheck = { ...inputFish };
  const legacySpeed =
    typeof fishWithLegacyCheck.speed === 'number' && fishWithLegacyCheck.speed <= 2;
  const hasLegacyAppearance = 'color' in fishWithLegacyCheck || 'pattern' in fishWithLegacyCheck;
  if (!fishWithLegacyCheck.genes && (hasLegacyAppearance || legacySpeed)) {
    fishWithLegacyCheck = migrateLegacyFish(fishWithLegacyCheck as UnknownRecord);
  }

  // Create a new validated object with proper typing
  const validated: FishData = { ...fishWithLegacyCheck };

  // Ensure required fields with proper types and defaults
  // FIXME: Should use uuid() instead of random string with timestamp that could be the same for multiple creatures if many need to get fixed at a single load/time
  if (typeof validated.id !== 'string' || !validated.id) {
    validated.id = `fish-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Basic properties with proper typing
  validated.name =
    typeof validated.name === 'string' && validated.name.trim() ? validated.name : 'Unnamed';
  validated.species =
    typeof validated.species === 'string' && validated.species.trim()
      ? validated.species
      : 'default';
  validated.sex =
    validated.sex === 'M' || validated.sex === 'F'
      ? validated.sex
      : Math.random() < 0.5
        ? 'M'
        : 'F';

  // Position and movement
  validated.x = typeof validated.x === 'number' ? validated.x : 50;
  validated.y = typeof validated.y === 'number' && validated.y > 150 ? validated.y : 160;
  validated.vx = typeof validated.vx === 'number' ? validated.vx : 0;
  validated.vy = typeof validated.vy === 'number' ? validated.vy : 0;
  validated.dir = typeof validated.dir === 'number' ? validated.dir : 0;

  // Size and growth
  validated.size = typeof validated.size === 'number' && validated.size > 0 ? validated.size : 6;
  validated.maxSize =
    typeof validated.maxSize === 'number' && validated.maxSize > 0
      ? Math.max(validated.maxSize, validated.size)
      : Math.max(validated.size, 30);
  validated.birthSize =
    typeof validated.birthSize === 'number' && validated.birthSize > 0
      ? validated.birthSize
      : Math.min(5, validated.size);

  // Age and life stage
  // Handle age and birthTime
  if (typeof validated.birthTime === 'number') {
    // Convert ms to s if needed (legacy)
    validated.birthTime =
      validated.birthTime > 1e12 ? Math.floor(validated.birthTime / 1000) : validated.birthTime;

    // Recalculate age in minutes with one decimal place
    const ageInSeconds = timestamp - validated.birthTime;
    validated.age = Math.round((ageInSeconds / 60) * 10) / 10; // One decimal place
  } else if (typeof validated.age === 'number') {
    // Calculate birthTime from age (age is in minutes)
    validated.age = Math.max(0, validated.age);
    validated.birthTime = timestamp - Math.round(validated.age * 60);
  } else {
    // New fish
    validated.birthTime = timestamp;
    validated.age = 0;
  }

  // Ensure age is never negative
  validated.age = Math.max(0, validated.age);

  // State handling
  validated.dead = validated.state === 'dead';
  if (validated.dead) {
    // Skip saving dead creatures by returning null (will be filtered out)
    return null;
  }
  // Always set state to 'wander' for living creatures
  validated.state = 'wander';
  validated.shiny = !!validated.shiny;
  validated.favorite = !!validated.favorite;

  // Initialize genes if missing
  if (!validated.genes || typeof validated.genes !== 'object') {
    validated.genes = {} as FishGenes;
  }

  // Gene validations
  const genes = validated.genes;

  // Drop legacy rarity tag (only keep rarityGene)
  if ('rarity' in validated) {
    delete (validated as UnknownRecord).rarity;
  }
  if (genes && typeof genes === 'object' && 'rarity' in genes) {
    delete (genes as UnknownRecord).rarity;
  }

  // Migrate old senseRadius to senseGene if needed
  if (
    typeof genes.senseGene !== 'number' ||
    !Number.isInteger(genes.senseGene) ||
    genes.senseGene < 1 ||
    genes.senseGene > 9
  ) {
    // If we have a legacy senseRadius, convert it to senseGene.
    if ('senseRadius' in validated) {
      const radiusValue = Number((validated as UnknownRecord).senseRadius);
      const normalized = radiusValue < 10 ? radiusValue : Math.round(radiusValue / 20);
      genes.senseGene = clampSenseGene(normalized);
      delete validated.senseRadius;
    } else if ('senseRadius' in genes) {
      const radiusValue = Number((genes as UnknownRecord).senseRadius);
      const normalized = radiusValue < 10 ? radiusValue : Math.round(radiusValue / 20);
      genes.senseGene = clampSenseGene(normalized);
      delete genes.senseRadius;
    } else {
      // Default value if neither exists
      genes.senseGene = 5; // Mid-range default
    }
  }
  // Always drop legacy senseRadius if it exists after normalization
  if ('senseRadius' in validated) {
    delete (validated as UnknownRecord).senseRadius;
  }
  if ('senseRadius' in genes) {
    delete (genes as UnknownRecord).senseRadius;
  }

  // Gene ranges (0-9 for all genes)
  const geneKeys: Array<keyof FishGenes> = [
    'speed',
    'senseGene',
    'hungerDrive',
    'rarityGene',
    'constitution',
  ];
  geneKeys.forEach(key => {
    if (key in genes && genes[key] !== undefined) {
      // We know these are number properties based on our FishGenes interface
      const value = genes[key];
      if (typeof value === 'number') {
        genes[key] = key === 'senseGene' ? clampSenseGene(value) : clampGene(value);
      } else {
        // If somehow it's not a number, set to default
        (genes as UnknownRecord)[key] = 5;
      }
    } else {
      // Set default gene value if missing
      (genes as UnknownRecord)[key] = 5; // Mid-range default
    }
  });

  // If top-level appearance fields exist and genes are missing, use top-level values.
  if (typeof validated.colorHue === 'number' && typeof genes.colorHue !== 'number') {
    genes.colorHue = validated.colorHue;
  }
  if (typeof validated.patternType === 'string' && typeof genes.patternType !== 'string') {
    genes.patternType = validated.patternType;
  }
  if (typeof validated.finShape === 'string' && typeof genes.finShape !== 'string') {
    genes.finShape = validated.finShape;
  }
  if (typeof validated.eyeType === 'string' && typeof genes.eyeType !== 'string') {
    genes.eyeType = validated.eyeType;
  }

  // Color and appearance - ensure colorHue is in valid range [0, 360)
  if (typeof genes.colorHue === 'number') {
    genes.colorHue = ((genes.colorHue % 360) + 360) % 360; // Normalize to [0, 360)
  } else {
    genes.colorHue = Math.random() * 360; // Random hue if not specified
  }

  // Patterns and features
  const validPatterns = ['solid', 'stripes', 'spots', 'gradient'];
  const validFins = ['pointy', 'round', 'fan', 'forked', 'lunate'];
  const validEyes = ['round', 'sleepy', 'sparkly', 'winking'];

  // Ensure valid pattern and appearance types with type safety
  const patternType = typeof genes.patternType === 'string' ? genes.patternType : 'solid';
  genes.patternType = validPatterns.includes(patternType) ? patternType : 'solid';

  const finShape = typeof genes.finShape === 'string' ? genes.finShape : 'fan';
  genes.finShape = validFins.includes(finShape) ? finShape : 'fan';

  const eyeType = typeof genes.eyeType === 'string' ? genes.eyeType : 'round';
  genes.eyeType = validEyes.includes(eyeType) ? eyeType : 'round';

  // Backward compatibility for top-level finShape
  if (validFins.includes(validated.finShape)) {
    genes.finShape = validated.finShape;
    delete validated.finShape;
  }

  // Normalize top-level gene fields to match validated genes
  const topLevelGenes: Array<keyof FishGenes> = [
    'speed',
    'senseGene',
    'hungerDrive',
    'rarityGene',
    'constitution',
  ];
  topLevelGenes.forEach(key => {
    if (typeof validated[key] === 'number') {
      validated[key] =
        key === 'senseGene' ? clampSenseGene(validated[key]) : clampGene(validated[key]);
    } else {
      (validated as UnknownRecord)[key] = genes[key];
    }
    (genes as UnknownRecord)[key] = (validated as UnknownRecord)[key];
  });

  // Normalize top-level appearance fields to match validated genes
  validated.colorHue = genes.colorHue;
  validated.patternType = genes.patternType;
  validated.finShape = genes.finShape;
  validated.eyeType = genes.eyeType;

  // Ensure canMate is a boolean (default: true)
  if (typeof validated.canMate !== 'boolean') {
    validated.canMate = true;
  }

  // Ensure phenotype exists
  if (!validated.phenotype || typeof validated.phenotype !== 'object') {
    validated.phenotype = { visual: {}, behavior: {} };
  }

  // Ensure lastUpdate is current
  validated.lastUpdate = Date.now();

  // Ensure all required arrays exist
  validated._bites = Array.isArray(validated._bites) ? validated._bites : [];

  // Ensure timers are valid numbers
  validated._ritualTimer = typeof validated._ritualTimer === 'number' ? validated._ritualTimer : 0;
  validated._breedCd = typeof validated._breedCd === 'number' ? validated._breedCd : 0;

  return validated;
}

/**
 * Validates and transforms a fish collection item (wrapper around fish data).
 * Ensures the embedded fishData is normalized and collection metadata exists.
 */
function validateAndTransformFishCollectionItem(
  item: unknown,
  timestamp: number
): FishCollectionItem | null {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    return null;
  }

  const input = item as FishCollectionItem;
  const validatedFish = validateAndTransformFish(input.fishData ?? input, timestamp);
  if (!validatedFish) {
    return null;
  }

  const resolvedId = typeof input.id === 'string' && input.id ? input.id : validatedFish.id;
  const resolvedLastSaved =
    typeof input.lastSaved === 'number'
      ? input.lastSaved
      : typeof input.timestamp === 'number'
        ? input.timestamp
        : Date.now();
  const resolvedSaveDate =
    typeof input.saveDate === 'string' && input.saveDate
      ? input.saveDate
      : new Date(Date.now()).toISOString();

  // Reconcile birthTime using earliest available dates minus age.
  const nowSeconds = Math.floor(Date.now() / 1000);
  const lastSavedSeconds = Math.floor(resolvedLastSaved / 1000);
  const saveDateMs = Date.parse(resolvedSaveDate);
  const saveDateSeconds = Number.isNaN(saveDateMs) ? nowSeconds : Math.floor(saveDateMs / 1000);
  const oldestSeconds = Math.min(nowSeconds, lastSavedSeconds, saveDateSeconds);
  if (typeof validatedFish.age === 'number') {
    const candidateBirth = Math.max(0, Math.floor(oldestSeconds - validatedFish.age * 60));
    if (typeof validatedFish.birthTime !== 'number' || candidateBirth < validatedFish.birthTime) {
      validatedFish.birthTime = candidateBirth;
      validatedFish.age = Math.max(
        0,
        Math.round(((nowSeconds - validatedFish.birthTime) / 60) * 10) / 10
      );
    }
  }

  const result: FishCollectionItem = {
    ...input,
    id: resolvedId,
    name:
      typeof input.name === 'string' && input.name.trim()
        ? input.name
        : validatedFish.name || 'Unnamed',
    species:
      typeof input.species === 'string' && input.species.trim()
        ? input.species
        : validatedFish.species || 'default',
    saveDate: resolvedSaveDate,
    lastSaved: resolvedLastSaved,
    fishData: validatedFish,
  };

  if ('timestamp' in result) {
    delete (result as UnknownRecord).timestamp;
  }

  return result;
}

/**
 * Creates a default fish object with valid default values
 */
function createDefaultFish() {
  const now = Date.now();
  const hue = Math.floor(Math.random() * 360);

  return {
    id: `fish-${now}-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Unnamed',
    species: 'default',
    x: 100,
    y: 100,
    vx: 0,
    vy: 0,
    dir: 0,
    size: 6,
    maxSize: 30,
    birthSize: 6,
    age: 0,
    birthTime: now,
    lastUpdate: now,
    sex: Math.random() < 0.5 ? 'M' : 'F',
    canMate: true,
    state: 'wander',
    dead: false,
    shiny: Math.random() < 0.02, // 2% chance to be shiny
    favorite: false,
    genes: {
      speed: 5,
      senseGene: 5,
      hungerDrive: 5,
      rarityGene: 5,
      constitution: 5,
      colorHue: hue,
      patternType: 'solid',
      finShape: 'fan',
      eyeType: 'round',
    },
    phenotype: {
      visual: {},
      behavior: {},
    },
    // Initialize empty arrays for later use
    _bites: [],
    _ritualTimer: 0,
    _breedCd: 0,
    _mateId: null,
  };
}

// Export default for easier importing
/**
 * Migrates legacy fish format to the new gene-based format
 */
/**
 * Migrates a legacy fish object to the current format
 * @param {any} fish - The legacy fish object to migrate
 * @returns {FishData} The migrated fish object in the current format
 */
function migrateLegacyFish(fish: UnknownRecord): FishData {
  const migrated = { ...fish };

  // Initialize genes if they don't exist
  if (!migrated.genes) {
    migrated.genes = {} as FishGenes;
  }

  // Migrate color
  if (migrated.color && !migrated.genes.colorHue) {
    // Convert hex to hue (simplified)
    if (migrated.color.startsWith('#')) {
      const hex = migrated.color.substring(1);
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0;

      if (max === min) {
        h = 0; // achromatic
      } else {
        const d = max - min;
        switch (max) {
          case r:
            h = (g - b) / d + (g < b ? 6 : 0);
            break;
          case g:
            h = (b - r) / d + 2;
            break;
          case b:
            h = (r - g) / d + 4;
            break;
        }
        h /= 6;
      }

      migrated.genes.colorHue = Math.round(h * 360);
    }
    delete migrated.color;
  }

  // Migrate pattern
  if (migrated.pattern && !migrated.genes.patternType) {
    migrated.genes.patternType = migrated.pattern;
    delete migrated.pattern;
  }

  // Migrate speed
  if (typeof migrated.speed === 'number' && !migrated.genes.speed) {
    // Convert speed (0-2 range) to gene (0-9 range)
    migrated.genes.speed = Math.min(9, Math.max(0, Math.round(migrated.speed * 4.5)));
    delete migrated.speed;
  }

  // Migrate finShape
  if (migrated.finShape && !migrated.genes.finShape) {
    migrated.genes.finShape = migrated.finShape;
    // Don't delete finShape as it might be used directly in some places
  }

  return migrated;
}

/**
 * Clamps a gene value to an integer within the specified range (0-9 by default).
 * Ensures the result is always an integer, even if non-integer min/max are provided.
 */
function clampGene(value: unknown, min: number = 0, max: number = 9): number {
  // Ensure min and max are integers
  const intMin = Math.max(0, Math.min(9, Math.round(Number(min) || 0)));
  const intMax = Math.min(9, Math.max(0, Math.round(Number(max) || 9)));

  // Ensure min <= max
  const [actualMin, actualMax] = intMin <= intMax ? [intMin, intMax] : [intMax, intMin];

  // Parse and round the input value, defaulting to mid-range if invalid
  const num =
    typeof value === 'number' && !isNaN(value)
      ? Math.round(Number(value))
      : Math.round((actualMin + actualMax) / 2);

  // Clamp to the valid range
  return Math.min(actualMax, Math.max(actualMin, num));
}

/**
 * Clamps senseGene to the valid range (1-9).
 */
function clampSenseGene(value: unknown): number {
  return clampGene(value, 1, 9);
}

function validateInventoryPresets(presets: unknown[]): InventoryPreset[] {
  const safePresets = presets
    .map(preset => normalizeInventoryPreset(preset))
    .filter((preset): preset is InventoryPreset => !!preset);

  const hasDefault = safePresets.some(preset => preset.isDefault || preset.id === 'preset-all');
  if (!hasDefault) {
    safePresets.unshift(DEFAULT_INVENTORY_PRESET);
  }

  return safePresets;
}

function normalizeInventoryPreset(preset: unknown): InventoryPreset | null {
  if (!preset || typeof preset !== 'object') {
    return null;
  }

  const input = preset as Partial<InventoryPreset>;
  const filters = normalizeInventoryFilters(input.filters);

  return {
    id: typeof input.id === 'string' && input.id ? input.id : `preset-${Date.now()}`,
    name: typeof input.name === 'string' && input.name ? input.name : 'Preset',
    isDefault: !!input.isDefault,
    filters,
    columnOrder: Array.isArray(input.columnOrder) ? input.columnOrder.filter(Boolean) : [],
    columnVisibility:
      input.columnVisibility && typeof input.columnVisibility === 'object'
        ? { ...(input.columnVisibility as Record<string, boolean>) }
        : {},
    sort:
      input.sort && typeof input.sort === 'object'
        ? {
            column: String((input.sort as { column?: string }).column || ''),
            direction: (input.sort as { direction?: string }).direction === 'desc' ? 'desc' : 'asc',
          }
        : null,
  };
}

function normalizeInventoryFilters(
  filters: InventoryPreset['filters'] | undefined
): Record<string, InventoryFilterRule> {
  if (!filters || typeof filters !== 'object') {
    return {};
  }

  const normalized: Record<string, InventoryFilterRule> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (!value || typeof value !== 'object') {
      continue;
    }
    const rule = value as InventoryFilterRule;
    if (rule.type === 'set' || rule.type === 'number-set') {
      normalized[key] = {
        type: rule.type,
        excluded: Array.isArray(rule.excluded) ? rule.excluded.map(String) : [],
      };
    } else if (rule.type === 'number-range') {
      normalized[key] = {
        type: 'number-range',
        min: typeof rule.min === 'number' ? rule.min : null,
        max: typeof rule.max === 'number' ? rule.max : null,
      };
    } else if (rule.type === 'text') {
      normalized[key] = {
        type: 'text',
        query: typeof rule.query === 'string' ? rule.query : '',
      };
    }
  }

  return normalized;
}

export default {
  validateAndTransformGameData,
  validateAndTransformFish,
  validateAndTransformFishCollectionItem,
  migrateLegacyFish,
};
