// ===============================
// src/game/creatureLoop.ts (integration example)
// ===============================
import { getEnv } from "../core/env";
import { updateMovement, handleFeeding, drawCreature } from "../creatures";
import { getSpecies } from "../creatures/registry";
import { kill, advanceDeath } from "../creatures/death";
import { MENU_BAR_HEIGHT, BOUNDARY_PAD } from "../creatures/constants";

export function updateCreatures(dt:number){
  const env = getEnv();
  for(let i=env.creatures.length-1; i>=0; i--){
    const c = env.creatures[i];

    // age & natural death
    const spec = getSpecies(c.speciesId);
    c.age += dt;
    if(c.life === "alive" && spec.life?.maxAgeSec && c.age >= spec.life.maxAgeSec && !c.favorite){
      kill(c);
    }

    // advance corpse float & despawn
    if(c.life === "dead"){
      const done = advanceDeath(c, dt);
      if(done){ env.creatures.splice(i,1); }
      continue;
    }

    // alive: behavior
    handleFeeding(c);
    updateMovement(c, dt);

    // simple bounds (account for a top menu)
    const { W,H } = env.getSize();
    if(c.x < BOUNDARY_PAD) { c.x = BOUNDARY_PAD; }
    if(c.x > W-BOUNDARY_PAD){ c.x = W-BOUNDARY_PAD; }
    const top = MENU_BAR_HEIGHT + BOUNDARY_PAD; if(c.y < top){ c.y = top; }
    if(c.y > H-BOUNDARY_PAD){ c.y = H-BOUNDARY_PAD; }
  }
}

export function drawCreatures(){
  const env = getEnv();
  for(const c of env.creatures){ drawCreature(env.ctx, c); }
}
