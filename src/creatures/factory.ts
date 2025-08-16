// ===============================
// src/creatures/factory.ts
// ===============================
import { getSpecies } from "./registry";
import { mixGeneticsFor } from "./genetics/base";
import type { CreatureBase } from "./types";

export function spawnCreature(speciesId: string, opts:any={}): CreatureBase {
  const spec = getSpecies(speciesId);
  return mixGeneticsFor(spec, opts);
}






/*
 * other old example of what this file might look like below here...
 *
 *

// src/creatures/factory.ts
import { getEnv } from "../core/env";
import { getSpecies } from "./registry";
import { mixGeneticsFor } from "./genetics/base";

export function spawnCreature(speciesId: string, opts = {}) {
  const spec = getSpecies(speciesId);
  const c = mixGeneticsFor(spec, opts); // handles defaults + parents + mutations
  const { W, H } = getEnv().getSize();
  c.x ??= Math.random() * (W-80) + 40;
  c.y ??= Math.random() * (H-80) + 40;
  return c;
}


 *
 *
 *
 */
