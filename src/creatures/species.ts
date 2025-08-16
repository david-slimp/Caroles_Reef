// src/creatures/species.ts
//
// This will need a lot more work for the full CFSV (Class/Family/Species/Variety) breakdown we ultimately want
export interface SpeciesConfig {
  id: string;              // "clownfish", "fireshrimp", "reefshark"
  displayName: string;
  layer: "swimmer" | "crawler" | "pelagic"; // rendering/movement lane
  breedable: boolean;
  diet: "pellets" | "scavenger" | "predator" | "omnivore";
  movement: {
    integrator: "swim2D" | "crawl2D" | "sharkPatrol2D";
    homeRadius: number;
    vmax: number;          // px/s cap
    turnRate: number;      // rad/s
    buoyancy?: number;     // optional vertical easing
  };
  genetics: {
    traits: string[];      // keys that matter for this species
    minAdultAgeSec: number;
    minAdultSizeFrac: number; // fraction of maxSize
    mutationRate: number;  // 0..1
  };
  spawning: {
    litterMin: number;
    litterMax: number;
  };
  art: {
    draw: (ctx: CanvasRenderingContext2D, c: CreatureBase) => void;
    drawCorpse?: (ctx: CanvasRenderingContext2D, c: CreatureBase) => void;
  };
  hooks?: Partial<{
    // lifecycle hooks that differ per species
    onSpawn: (c: CreatureBase) => void;
    onDeath: (c: CreatureBase) => void;
    onEat: (c: CreatureBase, food: any) => void;
    chooseMate: (self: CreatureBase, candidates: CreatureBase[]) => CreatureBase | null;
    breedingRule: (a: CreatureBase, b: CreatureBase) => boolean; // e.g., shark-only mate shark
    movementTick: (c: CreatureBase, dt: number) => void;        // species tweak
  }>;
}

