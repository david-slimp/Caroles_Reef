// ===============================
// src/creatures/breeding.ts
// ===============================
import type { CreatureBase } from "./types";
import { getSpecies } from "./registry";

export function isAdult(c: CreatureBase){
  const s = getSpecies(c.speciesId);
  return c.age >= s.genetics.minAdultAgeSec && c.size >= c.maxSize * s.genetics.minAdultSizeFrac;
}

export function tryStartRitual(a: CreatureBase, b: CreatureBase){
  const sa = getSpecies(a.speciesId), sb = getSpecies(b.speciesId);
  if(!sa.breedable || !sb.breedable) return false;
  if(sa.id !== sb.id) return false; // MVP same-species only
  if(!isAdult(a) || !isAdult(b)) return false;
  if(a._breedCd && a._breedCd>0) return false;
  if(b._breedCd && b._breedCd>0) return false;
  a._mateId = b.id; b._mateId = a.id; a._ritualTimer = b._ritualTimer = 10; // short MVP ritual
  a.state = b.state = "ritual";
  return true;
}

export function advanceRitual(c: CreatureBase, dt:number){
  if(c.state!=="ritual" || !c._ritualTimer) return null;
  c._ritualTimer -= dt;
  if(c._ritualTimer <= 0){ c.state = "wander"; c._breedCd = 60; return { spawn: true }; }
  return null;
}

