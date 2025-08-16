// ===============================
// src/creatures/species/fireshrimp.ts
// ===============================
import type { SpeciesConfig } from "../types";
import { registerSpecies } from "../registry";
import { drawFireShrimp } from "./renderers/fireshrimpDraw";


export const FireShrimp: SpeciesConfig = {
  id: "fireshrimp",
  displayName: "Blood Red Fire Shrimp",
  layer: "crawler",
  breedable: true,
  diet: "scavenger",
  movement: { integrator: "crawl2D", homeRadius: 60, vmax: 70, turnRate: Math.PI, buoyancy: -0.1 },
  genetics: { traits: ["colorHue", "size", "speedGene", "senseGene", "rarityGene"], minAdultAgeSec: 3*60, minAdultSizeFrac: 0.7, mutationRate: 0.06 },
  spawning: { litterMin: 1, litterMax: 3 },
  art: { draw: drawFireShrimp },
  hooks: {
    movementTick: (c) => { /* bias toward bottom; e.g., clamp y or add slight downward force */ }
  }
};

registerSpecies(FireShrimp);

