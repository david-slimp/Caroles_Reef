// ===============================
// src/creatures/validation.ts
// ===============================
import type { CreatureBase } from "./types";
import { getSpecies } from "./registry";

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
  
  // If any changes were made during validation, update localStorage
  if (wasModified && typeof window !== 'undefined' && window.localStorage) {
    try {
      const savedFish = JSON.parse(localStorage.getItem('caroles_reef_saved_fish') || '[]');
      const fishIndex = savedFish.findIndex((f: any) => f.fishData?.id === validated.id);
      
      if (fishIndex !== -1) {
        // Update the fish data in the saved array
        savedFish[fishIndex].fishData = validated;
        localStorage.setItem('caroles_reef_saved_fish', JSON.stringify(savedFish));
      }
    } catch (error) {
      console.error('Error updating fish in localStorage:', error);
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
  if (!validFins.includes(updatedFish.finShape)) {
    updatedFish.finShape = 'fan';
    
    // If this is a saved fish with an ID, update it in localStorage
    if (updatedFish.id) {
      try {
        const savedFish = JSON.parse(localStorage.getItem('savedFish') || '[]');
        const index = savedFish.findIndex((f: any) => f.id === updatedFish.id);
        if (index !== -1) {
          savedFish[index] = updatedFish;
          localStorage.setItem('savedFish', JSON.stringify(savedFish));
        }
      } catch (error) {
        console.error('Error updating fish in localStorage:', error);
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
