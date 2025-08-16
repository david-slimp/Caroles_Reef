// ===============================
// src/creatures/death.ts
// ===============================
import type { CreatureBase } from "./types";
import { getSpecies } from "./registry";
import { LIFE_DEFAULT } from "./constants";

export function kill(c: CreatureBase){ if(c.life==="dead") return; c.life="dead"; c.vx=0; c.vy=0; }

export function advanceDeath(c: CreatureBase, dt:number){
  if(c.life!=="dead") return false;
  const spec = getSpecies(c.speciesId);
  const rise = spec.life?.riseSpeed ?? LIFE_DEFAULT.RISE_SPEED;
  const offY = spec.life?.offY ?? LIFE_DEFAULT.OFF_Y;
  c.y += -rise * dt; // float upward (y-)
  if((c._corpseArea!=null && c._corpseArea<=0) || c.y < offY){ return true; }
  return false;
}
