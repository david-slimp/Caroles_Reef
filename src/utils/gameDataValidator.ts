import type { GameSaveData } from './localStorageManager';

/** Default game state for new players */
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
  tank: {
    background: 'default',
    decorations: [],
  },
  progress: {
    unlocked: ['basic_decor'],
    flags: {},
  },
};

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
  data: any,
  timestamp: number = Math.floor(Date.now() / 1000)
): T {

  if (!data || typeof data !== 'object') {
    throw new Error('Invalid game data: must be an object');
  }

  // Start with a shallow copy to avoid mutating the input
  const validated: any = { ...data };

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
    validated.fish = validated.fish.map((fish: FishData) => validateAndTransformFish(fish, timestamp));
  } else {
    validated.fish = [];
  }

  // Transform and validate tank data
  if (!validated.tank || typeof validated.tank !== 'object') {
    validated.tank = { background: 'default', decorations: [] };
  }
  
  if (!Array.isArray(validated.tank.decorations)) {
    validated.tank.decorations = [];
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
  [key: string]: any; // For backward compatibility with additional properties
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
  [key: string]: any; // For backward compatibility with additional properties
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
      sex: (defaultFish.sex === 'M' || defaultFish.sex === 'F') ? defaultFish.sex : 'M',
      genes: defaultFish.genes || {}
    };
  }
  
  // Type assertion for the input fish object
  const inputFish = fish as Partial<FishData>;
  
  // Handle legacy fish format (pre-gene system)
  const fishWithLegacyCheck = { ...inputFish };
  if (!fishWithLegacyCheck.genes && 
      (('color' in fishWithLegacyCheck) || 
       ('pattern' in fishWithLegacyCheck) || 
       ('speed' in fishWithLegacyCheck))) {
    return migrateLegacyFish(fishWithLegacyCheck);
  }

  // Create a new validated object with proper typing
  const validated: FishData = { ...fishWithLegacyCheck };

  // Ensure required fields with proper types and defaults
  // FIXME: Should use uuid() instead of random string with timestamp that could be the same for multiple creatures if many need to get fixed at a single load/time
  if (typeof validated.id !== 'string' || !validated.id) {
    validated.id = `fish-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Basic properties with proper typing
  validated.name = typeof validated.name === 'string' && validated.name.trim() ? validated.name : 'Unnamed';
  validated.species = typeof validated.species === 'string' && validated.species.trim() ? validated.species : 'default';
  validated.sex = (validated.sex === 'M' || validated.sex === 'F') ? validated.sex : (Math.random() < 0.5 ? 'M' : 'F');
  
  // Position and movement
  validated.x = typeof validated.x === 'number' ? validated.x : 50;
  validated.y = (typeof validated.y === 'number' && validated.y > 150) ? validated.y : 160;
  validated.vx = typeof validated.vx === 'number' ? validated.vx : 0;
  validated.vy = typeof validated.vy === 'number' ? validated.vy : 0;
  validated.dir = typeof validated.dir === 'number' ? validated.dir : 0;
  
  // Size and growth
  validated.size = typeof validated.size === 'number' && validated.size > 0 ? validated.size : 6;
  validated.maxSize = typeof validated.maxSize === 'number' && validated.maxSize > 0 ? 
    Math.max(validated.maxSize, validated.size) : Math.max(validated.size, 30);
  validated.birthSize = typeof validated.birthSize === 'number' && validated.birthSize > 0 ? 
    validated.birthSize : Math.min(5, validated.size);
  
  // Age and life stage
  // Handle age and birthTime
  if (typeof validated.birthTime === 'number') {
    // Convert ms to s if needed (legacy)
    validated.birthTime = validated.birthTime > 1e12 
      ? Math.floor(validated.birthTime / 1000) 
      : validated.birthTime;
    
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
  
  // Migrate old senseRadius to senseGene if needed
  if (typeof genes.senseGene !== 'number' || !Number.isInteger(genes.senseGene) || genes.senseGene < 0 || genes.senseGene > 9) {
    // If we have a legacy senseRadius, convert it to senseGene (radius/20, then clamp to 0-9)
    if ('senseRadius' in validated) {
      genes.senseGene = Math.min(9, Math.max(0, Math.round(validated.senseRadius / 20)));
      delete validated.senseRadius;
    } else if ('senseRadius' in genes) {
      genes.senseGene = Math.min(9, Math.max(0, Math.round(genes.senseRadius / 20)));
      delete genes.senseRadius;
    } else {
      // Default value if neither exists
      genes.senseGene = 5; // Mid-range default
    }
  }
  
  // Gene ranges (0-9 for all genes)
  const geneKeys: Array<keyof FishGenes> = ['speed', 'senseGene', 'hungerDrive', 'rarityGene', 'constitution'];
  geneKeys.forEach(key => {
    if (key in genes && genes[key] !== undefined) {
      // We know these are number properties based on our FishGenes interface
      const value = genes[key];
      if (typeof value === 'number') {
        genes[key] = clampGene(value);
      } else {
        // If somehow it's not a number, set to default
        (genes as any)[key] = 5;
      }
    } else {
      // Set default gene value if missing
      (genes as any)[key] = 5; // Mid-range default
    }
  });
  
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
      eyeType: 'round'
    },
    phenotype: {
      visual: {},
      behavior: {}
    },
    // Initialize empty arrays for later use
    _bites: [],
    _ritualTimer: 0,
    _breedCd: 0,
    _mateId: null
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
function migrateLegacyFish(fish: Record<string, any>): FishData {
  const migrated = { ...fish };
  
  // Initialize genes if they don't exist
  if (!migrated.genes) {
    migrated.genes = {} as any;
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
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
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
function clampGene(value: any, min: number = 0, max: number = 9): number {
  // Ensure min and max are integers
  const intMin = Math.max(0, Math.min(9, Math.round(Number(min) || 0)));
  const intMax = Math.min(9, Math.max(0, Math.round(Number(max) || 9)));
  
  // Ensure min <= max
  const [actualMin, actualMax] = intMin <= intMax ? [intMin, intMax] : [intMax, intMin];
  
  // Parse and round the input value, defaulting to mid-range if invalid
  const num = typeof value === 'number' && !isNaN(value) ? Math.round(Number(value)) : 
             Math.round((actualMin + actualMax) / 2);
              
  // Clamp to the valid range
  return Math.min(actualMax, Math.max(actualMin, num));
}

export default {
  validateAndTransformGameData,
  validateAndTransformFish,
  migrateLegacyFish
};
