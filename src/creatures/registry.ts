// ===============================
// src/creatures/registry.ts
// ===============================
import type { SpeciesConfig } from "./types";
const SPECIES = new Map<string, SpeciesConfig>();
export function registerSpecies(cfg: SpeciesConfig){ SPECIES.set(cfg.id, cfg); }
export function getSpecies(id: string){ const s = SPECIES.get(id); if(!s) throw new Error(`Species ${id} not found`); return s; }
export function allSpecies(){ return [...SPECIES.values()]; }

