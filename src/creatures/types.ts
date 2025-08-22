// ===============================
// src/creatures/types.ts
// ===============================
export type Sex = "M" | "F";
export type LifeState = "alive" | "dead";
export type BehaviorState = "wander" | "seekFood" | "seekMate" | "ritual" | "flee";

export interface CreatureBase {
  id: string;
  speciesId: string;
  name?: string;
  x: number; y: number; vx: number; vy: number; dir: number;
  age: number; favorite?: boolean;
  life: LifeState;
  state: BehaviorState;

  // generic genetics / body
  sex?: Sex;
  size: number; maxSize: number; birthSize: number;
  speedGene?: number; senseGene?: number; hungerGene?: number; rarityGene?: number;
// FIXME: only certain classes of animals will have "finShape" so we will need to decide on which sets of animals do and which do not and fit that in to our CFSV (Class/Family/Species/Variety) breakdown
  colorHue?: number; patternType?: string; finShape?: string; eyeType?: string;

  // breeding state
  _breedCd?: number;
  _mateId?: string | null;
  _ritualTimer?: number;

  // corpse / bites (optional)
  _bites?: { x: number; y: number; r: number }[];
  _corpseArea?: number;

  // misc
  shiny?: boolean;
}


export interface SpeciesConfig {
  id: string; displayName: string;
  layer: "swimmer" | "crawler" | "pelagic";
  breedable: boolean;
  diet: "pellets" | "scavenger" | "predator" | "omnivore";
  movement: { integrator: "swim2D" | "crawl2D" | "sharkPatrol2D"; homeRadius: number; vmax: number; turnRate: number; buoyancy?: number };
  genetics: { 
    traits: string[]; 
    minAdultAgeSec: number; 
    minAdultSizeFrac: number; 
    mutationRate: number;
    traitRanges?: {
      [trait: string]: { min: number; max: number; default: number };
    };
  };
  spawning: { litterMin: number; litterMax: number };
  art: { draw: (ctx: CanvasRenderingContext2D, c: CreatureBase) => void; drawCorpse?: (ctx: CanvasRenderingContext2D, c: CreatureBase) => void };
  hooks?: Partial<{ onSpawn: (c: CreatureBase) => void; onDeath: (c: CreatureBase) => void; onEat: (c: CreatureBase, food: any) => void; chooseMate: (self: CreatureBase, candidates: CreatureBase[]) => CreatureBase | null; breedingRule: (a: CreatureBase, b: CreatureBase) => boolean; movementTick: (c: CreatureBase, dt: number) => void }>;
}

