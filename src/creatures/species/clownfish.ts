// ===============================
// src/creatures/species/clownfish.ts
// ===============================
import type { SpeciesConfig } from "../types";
import { registerSpecies } from "../registry";
import { drawClownfish } from "./renderers/clownfishDraw";

export const Clownfish: SpeciesConfig = {
  id: "clownfish",
  displayName: "Clownfish",
  layer: "swimmer",
  breedable: true,
  diet: "omnivore",
  movement: { integrator: "swim2D", homeRadius: 90, vmax: 120, turnRate: Math.PI*1.2 },
  genetics: { 
    traits: ["sex","size","speedGene","senseGene","hungerGene","rarityGene","colorHue"], 
    minAdultAgeSec: 4*60, 
    minAdultSizeFrac: 0.5, 
    mutationRate: 0.05,
    // Add validation ranges for traits
    traitRanges: {
      size: { min: 5, max: 20, default: 10 },
      speedGene: { min: 1, max: 10, default: 5 },
      senseGene: { min: 1, max: 10, default: 5 },
      hungerGene: { min: 1, max: 10, default: 5 },
      rarityGene: { min: 1, max: 10, default: 1 },
      colorHue: { min: 0, max: 360, default: 30 },
    }
  },
  spawning: { litterMin: 1, litterMax: 5 },
  art: { draw: drawClownfish },
};

registerSpecies(Clownfish);

