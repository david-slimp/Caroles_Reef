export function drawClownfish(ctx:CanvasRenderingContext2D, c:CreatureBase){
  ctx.save();
  ctx.translate(c.x, c.y); ctx.rotate(c.dir);
  const len = Math.max(16, c.size*2.2); const ht = Math.max(10, c.size*1.2);
  const base = `hsl(${c.colorHue ?? 20} 70% 55%)`;
  const light= `hsl(${c.colorHue ?? 20} 80% 70%)`;
  // tail
  ctx.fillStyle = light; ctx.beginPath();
  ctx.moveTo(-len*0.5,0); ctx.quadraticCurveTo(-len*0.7, -ht*0.2, -len*0.9, 0); ctx.quadraticCurveTo(-len*0.7, ht*0.2, -len*0.5, 0); ctx.fill();
  // body
  const grd = ctx.createLinearGradient(-len*0.5,0,len*0.5,0); grd.addColorStop(0, base); grd.addColorStop(1, light);
  ctx.fillStyle = grd; ctx.beginPath(); ctx.ellipse(0,0,len*0.5,ht*0.5,0,0,Math.PI*2); ctx.fill();
  // eye (right side)
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(len*0.22, -ht*0.1, Math.max(2, ht*0.12), 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(len*0.22+1, -ht*0.1, Math.max(1, ht*0.06), 0, Math.PI*2); ctx.fill();
  // nose marker forward (+X)
  ctx.fillStyle = '#ff0'; ctx.beginPath(); ctx.arc(len*0.5, 0, 2, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

