// ===============================
// src/creatures/validation.ts
// ===============================
import type { CreatureBase } from "./types";
import { getSpecies } from "./registry";
import { storageManager } from "../utils/localStorageManager";

// Note: This module now only handles validation and in-memory updates
// All persistence to storage should be handled by the storage manager's save cycle

interface ValidationResult<T> {
  validated: T;
  wasModified: boolean;
}

/**
 * Validates and normalizes a creature's traits based on its species configuration.
 * Ensures all traits are within their defined ranges and applies defaults if needed.
 * @returns An object containing the validated creature and a flag indicating if any changes were made
 */
export function validateCreatureTraits(creature: CreatureBase): ValidationResult<CreatureBase> {
  const species = getSpecies(creature.speciesId);
  const traitRanges = species.genetics.traitRanges;
  
  if (!traitRanges) {
    return { validated: creature, wasModified: false }; // No validation needed if no ranges defined
  }

  // Create a shallow copy to avoid mutating the original
  const validated = { ...creature };
  let wasModified = false;

  // Special validation for finShape
  if ('finShape' in validated) {
    const validFinShapes = ['pointy', 'round', 'fan', 'forked', 'lunate'] as const;
    if (!validFinShapes.includes(validated.finShape as any)) {
      validated.finShape = 'fan'; // Set default to 'fan' if invalid
      wasModified = true;
    }
  }

  // Validate each trait that has a defined range
  for (const [trait, range] of Object.entries(traitRanges)) {
    // Only validate if the trait exists on the creature
    if (trait in validated) {
      const value = (validated as any)[trait];
      let newValue = value;
      
      // If value is undefined, use the default
      if (value === undefined) {
        newValue = range.default;
        wasModified = true;
      } 
      // If value is defined but outside the range, clamp it
      else if (typeof value === 'number') {
        const clamped = Math.max(range.min, Math.min(range.max, value));
        if (clamped !== value) {
          newValue = clamped;
          wasModified = true;
        }
      }
      
      if (wasModified) {
        (validated as any)[trait] = newValue;
      }
    }
  }

  return { validated, wasModified };
}

/**
 * Validates and normalizes a creature's position and other properties.
 * @returns An object containing the validated creature and a flag indicating if any changes were made
 */
export function validateCreaturePosition(creature: CreatureBase, worldWidth: number, worldHeight: number): ValidationResult<CreatureBase> {
  const validated = { ...creature };
  let wasModified = false;
  
  // Ensure position is within world bounds
  const newX = Math.max(0, Math.min(worldWidth, validated.x));
  const newY = Math.max(0, Math.min(worldHeight, validated.y));
  
  if (newX !== validated.x || newY !== validated.y) {
    validated.x = newX;
    validated.y = newY;
    wasModified = true;
  }
  
  // Ensure size is positive and makes sense
  if (validated.size <= 0) {
    validated.size = 1;
    wasModified = true;
  }
  if (validated.maxSize <= 0) {
    validated.maxSize = validated.size || 10;
    wasModified = true;
  }
  if (validated.birthSize <= 0) {
    validated.birthSize = validated.size || 5;
    wasModified = true;
  }
  
  return { validated, wasModified };
}

/**
 * Validates a creature and returns a new, validated creature.
 * This should be called whenever a creature is loaded or created.
 * @returns An object containing the validated creature and a flag indicating if any changes were made
 */
export function validateCreature(
  creature: CreatureBase, 
  worldWidth: number = 1000, 
  worldHeight: number = 800
): ValidationResult<CreatureBase> {
  // First validate traits
  const traitsResult = validateCreatureTraits(creature);
  
  // Then validate position and other properties
  const positionResult = validateCreaturePosition(traitsResult.validated, worldWidth, worldHeight);
  
  // Combine the results
  return {
    validated: positionResult.validated,
    wasModified: traitsResult.wasModified || positionResult.wasModified
  };
}

/**
 * Validates a creature and updates localStorage if any changes were made during validation.
 * This is the main function to use when loading creatures from localStorage.
 */
export function validateAndUpdateCreature(
  creature: CreatureBase,
  worldWidth: number = 1000,
  worldHeight: number = 800
): CreatureBase {
  const { validated, wasModified } = validateCreature(creature, worldWidth, worldHeight);
  
  // If any changes were made during validation, update the fish in the in-memory collection
  if (wasModified) {
    try {
      const currentData = storageManager.getCurrentData();
      const fishIndex = currentData.fishCollection?.findIndex((f: any) => f.fishData?.id === validated.id);
      
      if (fishIndex !== undefined && fishIndex !== -1) {
        // Update the fish in the collection
        // FIXME: why are we using storageManager.getCurrentData here? We should already have the data to validate being passed in to us!
        const currentData = storageManager.getCurrentData() as any; // Cast to any to bypass readonly
        const updatedCollection = [...(currentData.fishCollection || [])];
        const fishIndex = updatedCollection.findIndex((fish: any) => fish.id === validated.id);
        
        if (fishIndex !== -1) {
          updatedCollection[fishIndex] = {
            ...updatedCollection[fishIndex],
            fishData: validated,
            timestamp: Date.now()
          };
          
          // Update the in-memory data without persisting to storage
          // Persistence to storage will be handled by the storage manager's save cycle
          currentData.fishCollection = updatedCollection;
        }
      }
    } catch (error) {
      console.error('Error updating fish in memory:', error);
    }
  }
  
  return validated;
}

/**
 * Validates and updates fish fin shape, ensuring it's one of the valid options.
 * Saves the updated fish back to localStorage if changes were made.
 * @param fishData The fish data to validate
 * @returns The validated fish data
 */
export function validateFishFinShape(fishData: any): any {
  const validFins = ['pointy', 'round', 'fan', 'forked', 'lunate'] as const;
  const updatedFish = { ...fishData };
  
  // Check if fin shape is valid
  if (updatedFish.finShape && !validFins.includes(updatedFish.finShape)) {
    updatedFish.finShape = 'fan';
    
    // If this is a saved fish with an ID, update it in the in-memory collection
    if (updatedFish.id) {
      try {
        // FIXME: why are we using storageManager.getCurrentData here? We should already have the data to validate being passed in to us!
        const currentData = storageManager.getCurrentData() as any; // Cast to any to bypass readonly
        const updatedCollection = (currentData.fishCollection || []).map((fish: any) => 
          fish.id === updatedFish.id ? { ...fish, fishData: updatedFish, timestamp: Date.now() } : fish
        );
        
        // Update the in-memory data without persisting to storage
        // Persistence to storage will be handled by the storage manager's save cycle
        (currentData as any).fishCollection = updatedCollection;
      } catch (error) {
        console.error('Error updating fish in memory:', error);
      }
    }
  }
  
  return updatedFish;
}

export default {
  validateCreature,
  validateAndUpdateCreature,
  validateCreatureTraits,
  validateCreaturePosition,
  validateFishFinShape
};
