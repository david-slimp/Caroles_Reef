// ===============================
// src/creatures/rendering.ts
// ===============================
import type { CreatureBase } from "./types";
import { getSpecies } from "./registry";

export function drawCreature(ctx:CanvasRenderingContext2D, c:CreatureBase){
  const spec = getSpecies(c.speciesId);
  spec.art.draw(ctx, c);
}
