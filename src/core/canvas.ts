export function initCanvas(id: string) {
  const c = document.getElementById(id) as HTMLCanvasElement;
  if (!c) throw new Error(`#${id} not found`);
  const ctx = c.getContext('2d')!;
  const DPR = Math.max(1, window.devicePixelRatio || 1);
  function resize() {
    const w = innerWidth,
      h = innerHeight;
    c.width = Math.floor(w * DPR);
    c.height = Math.floor(h * DPR);
    c.style.width = w + 'px';
    c.style.height = h + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  addEventListener('resize', resize);
  resize();
  return { ctx, getSize: () => ({ width: c.width / DPR, height: c.height / DPR }), canvas: c };
}
