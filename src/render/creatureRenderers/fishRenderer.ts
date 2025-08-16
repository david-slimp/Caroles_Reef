import type { Creature } from '../../entities/creature';
export function drawFish(ctx: CanvasRenderingContext2D, f: Creature) {
  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.rotate(f.dir);
  ctx.fillStyle = 'hsl(200 70% 55%)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
