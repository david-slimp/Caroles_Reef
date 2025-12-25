// @ts-nocheck
/**
 * Food pellets system extracted from legacy code.
 * API kept minimal to match original behavior from runLegacyGame.
 */
export type Pellet = { id: string; x: number; y: number; vy: number; r: number };

export function addPellet(
  pellets: Pellet[],
  x: number,
  y: number,
  rand: (a: number, b: number) => number,
  uuid: () => string
) {
  pellets.push({ id: uuid(), x, y, vy: 20 + rand(0, 30), r: 4 });
}

export function updatePellets(pellets: Pellet[], dt: number, H: number) {
  for (let i = pellets.length - 1; i >= 0; i--) {
    const p = pellets[i];
    p.y += p.vy * dt;
    if (p.y > H - 8) p.vy = 0;
    if (p.y > H + 20) pellets.splice(i, 1);
  }
}

export function drawPellets(ctx: CanvasRenderingContext2D, pellets: Pellet[]) {
  ctx.fillStyle = "rgba(255,200,80,0.95)";
  pellets.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });
}
