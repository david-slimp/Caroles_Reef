export function startLoop(h: { update: (dt: number) => void; draw: () => void }) {
  let last = performance.now();
  function f(now: number) {
    const dt = (now - last) / 1000;
    last = now;
    h.update(dt);
    h.draw();
    requestAnimationFrame(f);
  }
  requestAnimationFrame(f);
}
