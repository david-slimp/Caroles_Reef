// @ts-nocheck
/**
 * Bubbles system extracted from legacy code.
 * Keeps the exact visual and behavioral logic while being modular.
 */
export function createBubbles(
  getSize: () => { W: number; H: number },
  ctx: CanvasRenderingContext2D
) {
  const bubbles = {
    pool: [] as Array<{ x: number; y: number; r: number; v: number }>,
    targetDensity: 0.6,
    update(dt: number) {
      const { W, H } = getSize();
      if (this.pool.length < this.targetDensity * 120) {
        this.pool.push({
          x: Math.random() * W,
          y: Math.random() * (H - H * 0.6) + H * 0.6,
          r: 1 + Math.random() * 3,
          v: 20 + Math.random() * 30,
        });
      }
      this.pool.forEach(b => {
        b.y -= b.v * dt;
        if (b.y < -10) {
          b.y = H + Math.random() * 60;
          b.x = Math.random() * W;
        }
      });
    },
    draw() {
      const { W, H } = getSize();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#ffffff';
      this.pool.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    },
  };
  return bubbles;
}
