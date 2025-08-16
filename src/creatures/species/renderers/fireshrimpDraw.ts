// ===============================
// src/creatures/species/renderers/fireshrimpDraw.ts
// ===============================
import type { CreatureBase } from "../../types";
export function drawFireShrimp(ctx:CanvasRenderingContext2D, c:CreatureBase){
  ctx.save(); ctx.translate(c.x,c.y); ctx.rotate(c.dir);
  const len = Math.max(14, c.size*1.8), ht=Math.max(8,c.size);
  ctx.fillStyle = `hsl(${c.colorHue ?? 5} 80% 50%)`;
  ctx.beginPath(); ctx.ellipse(0,0,len*0.5,ht*0.5,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.fillRect(-len*0.1,-ht*0.05,len*0.2,ht*0.1); // stripe hint
  ctx.restore();
}

