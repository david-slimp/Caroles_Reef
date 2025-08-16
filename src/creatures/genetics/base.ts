// ===============================
// src/creatures/genetics/base.ts
// ===============================
import type { CreatureBase, SpeciesConfig } from "../types";
import { uuid, randi, rand } from "../utils";

export function mixGeneticsFor(spec: SpeciesConfig, opts:any={}): CreatureBase {
  // Minimal generic mixer (no parents yet). Extend later per species.
  const birthSize = opts.birthSize ?? randi(2, 8);
  const maxSize   = opts.maxSize   ?? randi(20, 60);
  const size      = opts.size      ?? Math.max(birthSize, randi(birthSize, maxSize));
  const colorHue  = opts.colorHue  ?? randi(0, 360);

  const c: CreatureBase = {
    id: uuid(), speciesId: spec.id,
    x: opts.x ?? 100 + Math.random()*200,
    y: opts.y ?? 100 + Math.random()*120,
    vx: 0, vy: 0, dir: rand(0, Math.PI*2),
    age: 0, life: "alive", state: "wander",
    birthSize, maxSize, size,
    speedGene: opts.speedGene ?? randi(2,8),
    senseGene: opts.senseGene ?? randi(0,9),
    hungerGene: opts.hungerGene ?? randi(2,8),
    rarityGene: opts.rarityGene ?? randi(0,9),
    colorHue,
  };
  spec.hooks?.onSpawn?.(c);
  return c;
}

