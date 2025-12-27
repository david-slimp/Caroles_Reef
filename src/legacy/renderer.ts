// @ts-nocheck
/**
 * Renderer extracted from legacy code.
 * Clears canvas, draws background, decor, pellets, fish, and bubbles.
 */
export function createRenderer(deps: {
  ctx: CanvasRenderingContext2D;
  getSize: () => { W: number; H: number };
  themeRef: { value: string };
  drawBackground: (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    theme: string
  ) => Promise<void>;
  drawDecor: () => void;
  drawPellets: (ctx: CanvasRenderingContext2D) => void;
  drawFish: (f: any) => void;
  fish: any[];
  bubbles: { draw: () => void };
}) {
  const {
    ctx,
    getSize,
    themeRef,
    drawBackground,
    drawDecor,
    drawPellets,
    drawFish,
    fish,
    bubbles,
  } = deps;

  async function draw() {
    const { W, H } = getSize();
    ctx.clearRect(0, 0, W, H);
    await drawBackground(ctx, W, H, themeRef.value);
    drawDecor();
    drawPellets(ctx);
    fish.forEach(f => drawFish(f, ctx));
    bubbles.draw();
  }

  return { draw };
}
