// @ts-nocheck
/**
 * Mouse/keyboard input extracted from legacy code.
 * Handles dragging fish, clicking to open FishCard or place decor, and 'f' key for food.
 */
export function attachInputHandlers(opts: {
  canvas: HTMLCanvasElement;
  getSize: () => { W: number; H: number };
  clamp: (v: number, a: number, b: number) => number;
  topInset?: number;
  pickFish: (x: number, y: number) => any | null;
  placeDecor: (x: number, y: number) => void;
  showFishCard: (f: any) => void;
  addPellet: (x: number, y: number) => void;
  modeRef: { value: string };
  panelDecorEl: HTMLElement;
}) {
  const {
    canvas,
    getSize,
    clamp,
    topInset,
    pickFish,
    placeDecor,
    showFishCard,
    addPellet,
    modeRef,
    panelDecorEl,
  } = opts;

  const mouse = { x: 0, y: 0, down: false };
  let dragging: any = null;
  const dragOffset = { x: 0, y: 0 };

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    const { W, H } = getSize();
    const minY = Math.max(10, topInset || 0);
    if (dragging) {
      dragging.x = clamp(mouse.x - dragOffset.x, 10, W - 10);
      dragging.y = clamp(mouse.y - dragOffset.y, minY, H - 10);
    }
  });

  canvas.addEventListener('mousedown', e => {
    mouse.down = true;
    const f = pickFish(mouse.x, mouse.y);
    if (f) {
      dragging = f;
      dragging.drag = true;
      dragOffset.x = mouse.x - f.x;
      dragOffset.y = mouse.y - f.y;
    }
  });

  window.addEventListener('mouseup', () => {
    mouse.down = false;
    if (dragging) {
      dragging.drag = false;
      dragging = null;
    }
  });

  canvas.addEventListener('click', e => {
    const f = pickFish(mouse.x, mouse.y);
    if (f) {
      showFishCard(f);
    } else if (panelDecorEl.style.display === 'block') {
      placeDecor(mouse.x, mouse.y);
    }
  });

  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'f' || e.key === 'F') {
      modeRef.value = 'food';
      addPellet(mouse.x, mouse.y);
    }
  });
}
