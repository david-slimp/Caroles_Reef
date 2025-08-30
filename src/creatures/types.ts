// ===============================
// src/creatures/types.ts
// ===============================

/**
 * Base interface for all creature types in the game
 */
export interface CreatureBase {
  id: string;
  speciesId: string;
  name?: string;
  x: number;
  y: number;
  size: number;
  maxSize: number;
  birthSize: number;
  speed: number;
  direction: number;
  energy: number;
  health: number;
  age: number;
  sex: 'male' | 'female';
  generation: number;
  parents?: {
    motherId?: string;
    fatherId?: string;
  };
  // Add any other common properties here
  [key: string]: any;
}

/**
 * Configuration for a species of creature
 */
export interface SpeciesConfig {
  id: string;
  displayName: string;
  description: string;
  baseSpeed: number;
  baseSize: number;
  baseHealth: number;
  baseEnergy: number;
  genetics: {
    traitRanges?: {
      [trait: string]: {
        min: number;
        max: number;
        default: number;
      };
    };
    // Add any other genetic configuration here
  };
  // Add any other species-specific configuration here
  [key: string]: any;
}

/**
 * Type for fish-specific creature data
 */
export interface FishData extends CreatureBase {
  finShape?: 'pointy' | 'round' | 'fan' | 'forked' | 'lunate';
  patternType?: string;
  colorHue?: number;
  senseGene?: number;
  hungerDrive?: number;
  rarityGene?: number;
  constitution?: number;
  shiny?: boolean;
  favorite?: boolean;
  dead?: boolean;
  originalId?: string;
}
