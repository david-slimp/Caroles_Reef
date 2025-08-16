// ===============================
// src/creatures/feeding.ts
// ===============================
import type { CreatureBase } from "./types";
import { getSpecies } from "./registry";
import { getEnv } from "../core/env";
import { FEEDING } from "./constants";

export async function handleFeeding(c: CreatureBase){
  const spec = getSpecies(c.speciesId);
  const env = getEnv();

  // find nearest pellet and nearest corpse within sensing radius
  const sense = (c.senseGene ?? 0) * FEEDING.SENSE_PIXEL_PER_GENE;

  let bestPellet:any=null, bestPelletD=Infinity;
  for(let i=0;i<env.pellets.length;i++){
    const p = env.pellets[i];
    const dx=p.x-c.x, dy=p.y-c.y; const d2=dx*dx+dy*dy; if(d2 < bestPelletD && d2 <= sense*sense){ bestPellet=p; bestPelletD=d2; }
  }

  let bestCorpse:CreatureBase|null=null, bestCorpseD=Infinity;
  for(const other of env.creatures){
    if(other===c) continue; if(other.life!=="dead") continue; if(other._corpseArea!=null && other._corpseArea<=0) continue;
    const dx=other.x-c.x, dy=other.y-c.y; const d2=dx*dx+dy*dy; if(d2 < bestCorpseD && d2 <= sense*sense){ bestCorpse=other; bestCorpseD=d2; }
  }

  // choose target preference (pellet first)
  const targetPellet = bestPellet && (!bestCorpse || bestPelletD <= bestCorpseD*0.9);

  // Eat pellet if close enough
  if(targetPellet){
    const d = Math.sqrt(bestPelletD);
    if(d < Math.max(12, c.size*0.85)){
      // consume pellet
      const idx = env.pellets.indexOf(bestPellet);
      if(idx>=0) env.pellets.splice(idx,1);
      // grow and update collection
      const newSize = Math.min(c.size + FEEDING.GROWTH_PER_PELLET, c.maxSize);
      if (newSize !== c.size) {
        c.size = newSize;
        // If this fish is from the collection, update it there too
        if (c.originalId) {
          try {
            const { updateFishProperties } = await import('../entities/fish');
            await updateFishProperties(c, {
              size: newSize,
              lastUpdated: new Date().toISOString()
            }, true);
          } catch (error) {
            console.error('Error updating fish size in collection:', error);
          }
        }
      }
      spec.hooks?.onEat?.(c, bestPellet);
      return; // done this frame
    }
  }

  // Nibble corpse if close enough
  if(bestCorpse){
    const d = Math.sqrt(bestCorpseD);
    if(d < Math.max(12, c.size*0.85)){
      // bite area reduction
      if(bestCorpse._corpseArea == null) bestCorpse._corpseArea = Math.PI * 100; // default area if not set
      const biteArea = Math.PI * FEEDING.CORPSE_BITE_RADIUS * FEEDING.CORPSE_BITE_RADIUS;
      bestCorpse._corpseArea = Math.max(0, bestCorpse._corpseArea - biteArea);
      // eater grows a bit and update collection
      const newSize = Math.min(c.size + FEEDING.CORPSE_GROWTH, c.maxSize);
      if (newSize !== c.size) {
        c.size = newSize;
        // If this fish is from the collection, update it there too
        if (c.originalId) {
          try {
            const { updateFishProperties } = await import('../entities/fish');
            await updateFishProperties(c, {
              size: newSize,
              lastUpdated: new Date().toISOString()
            }, true);
          } catch (error) {
            console.error('Error updating fish size in collection:', error);
          }
        }
      }
      // flee from corpse
      c._fleeFromX = bestCorpse.x; c._fleeFromY = bestCorpse.y; c._fleeDistLeft = FEEDING.FLEE_DIST_PIXELS; c.state = "flee";
      return;
    }
  }

  // Light heading nudge toward nearest edible target (visual guidance)
  const tgt = targetPellet ? bestPellet : bestCorpse;
  if(tgt){
    const yaw = Math.atan2(tgt.y - c.y, tgt.x - c.x);
    c.dir = c.dir + Math.atan2(Math.sin(yaw - c.dir), Math.cos(yaw - c.dir)) * 0.15;
  }
}
