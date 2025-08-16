// ===============================
// src/creatures/species/renderers/reefsharkDraw.ts
// ===============================
import type { CreatureBase } from "../../types";
export function drawReefShark(ctx:CanvasRenderingContext2D, c:CreatureBase){
  ctx.save(); ctx.translate(c.x,c.y); ctx.rotate(c.dir);
  const len = Math.max(60, c.size*3.2), ht=Math.max(20,c.size*1.2);
  ctx.fillStyle = '#7aa0b8';
  ctx.beginPath(); ctx.moveTo(-len*0.45,0); ctx.quadraticCurveTo(0,-ht*0.6,len*0.5,0); ctx.quadraticCurveTo(0, ht*0.6,-len*0.45,0); ctx.fill();
  // dorsal fin
  ctx.fillStyle = '#5c8199'; ctx.beginPath(); ctx.moveTo(-len*0.1, -ht*0.6); ctx.lineTo(0, -ht*1.2); ctx.lineTo(len*0.1, -ht*0.6); ctx.closePath(); ctx.fill();
  // eye
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(len*0.25, -ht*0.1, 3, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

