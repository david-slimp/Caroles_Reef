// ===============================
// src/creatures/factory.ts
// ===============================
import { getSpecies } from "./registry";
import { mixGeneticsFor } from "./genetics/base";
import type { CreatureBase } from "./types";
import { validateAndUpdateCreature } from "./validation";
import { getEnv } from "../core/env";

/**
 * Creates a new creature with the specified species and options.
 * Validates the creature's traits and position before returning.
 */
export function spawnCreature(speciesId: string, opts: any = {}): CreatureBase {
  const spec = getSpecies(speciesId);
  const creature = mixGeneticsFor(spec, opts);
  
  // Get world dimensions for position validation
  const env = getEnv();
  const size = env.getSize ? env.getSize() : { W: 1000, H: 800 };
  const { W: width = 1000, H: height = 800 } = size;
  
  // Validate, update localStorage if needed, and return the creature
  return validateAndUpdateCreature(creature, width, height);
}

