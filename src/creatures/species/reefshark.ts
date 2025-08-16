// ===============================
// src/creatures/species/reefshark.ts
// ===============================
import type { SpeciesConfig } from "../types";
import { registerSpecies } from "../registry";
import { drawReefShark } from "./renderers/reefsharkDraw";


export const ReefShark: SpeciesConfig = {
  id: "reefshark",
  displayName: "Reef Shark",
  layer: "pelagic",
  breedable: false,                // MVP: no breeding
  diet: "predator",
  movement: { integrator: "sharkPatrol2D", homeRadius: 160, vmax: 180, turnRate: Math.PI * 0.8 },
  genetics: { traits: ["size", "speedGene", "senseGene"], minAdultAgeSec: 0, minAdultSizeFrac: 1, mutationRate: 0.02 },
  spawning: { litterMin: 0, litterMax: 0 },
  art: { draw: drawReefShark },
  hooks: {
    movementTick: (c) => { /* keep altitude midwater; gentle wide arcs */ }
  }
};

registerSpecies(ReefShark);

