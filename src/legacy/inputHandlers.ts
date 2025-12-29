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
  pickDecor: (x: number, y: number) => any | null;
  removeDecor: (d: any) => boolean;
  placeDecor: (x: number, y: number) => void;
  showFishCard: (f: any) => void;
  addPellet: (x: number, y: number) => void;
  modeRef: { value: string };
  panelDecorEl: HTMLElement;
  onDecorChanged?: () => void;
}) {
  const {
    canvas,
    getSize,
    clamp,
    topInset,
    pickFish,
    pickDecor,
    removeDecor,
    placeDecor,
    showFishCard,
    addPellet,
    modeRef,
    panelDecorEl,
    onDecorChanged,
  } = opts;

  const mouse = { x: 0, y: 0, down: false };
  let dragging: any = null;
  let draggingDecor: any = null;
  let suppressClick = false;
  let dragMoved = false;
  const dragOffset = { x: 0, y: 0 };
  const dragDecorOffset = { x: 0, y: 0 };
  let dragStart = { x: 0, y: 0 };

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    const { W, H } = getSize();
    const minY = Math.max(10, topInset || 0);
    if (dragging) {
      dragging.x = clamp(mouse.x - dragOffset.x, 10, W - 10);
      dragging.y = clamp(mouse.y - dragOffset.y, minY, H - 10);
      const dx = mouse.x - dragStart.x;
      const dy = mouse.y - dragStart.y;
      if (!dragMoved && Math.hypot(dx, dy) > 4) {
        dragMoved = true;
      }
    }
    if (draggingDecor) {
      draggingDecor.x = clamp(mouse.x - dragDecorOffset.x, 10, W - 10);
      draggingDecor.y = clamp(mouse.y - dragDecorOffset.y, minY, H - 10);
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
      dragStart = { x: mouse.x, y: mouse.y };
      dragMoved = false;
      return;
    }

    if (panelDecorEl.style.display === 'block') {
      const d = pickDecor(mouse.x, mouse.y);
      if (d) {
        draggingDecor = d;
        dragDecorOffset.x = mouse.x - d.x;
        dragDecorOffset.y = mouse.y - d.y;
        suppressClick = true;
      }
    }
  });

  window.addEventListener('mouseup', () => {
    mouse.down = false;
    if (dragging) {
      dragging.drag = false;
      if (!dragMoved) {
        showFishCard(dragging);
        suppressClick = true;
      }
      dragging = null;
      dragMoved = false;
    }
    if (draggingDecor) {
      draggingDecor = null;
      if (onDecorChanged) {
        onDecorChanged();
      }
    }
  });

  canvas.addEventListener('click', e => {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    const f = pickFish(mouse.x, mouse.y);
    if (f) {
      showFishCard(f);
    } else if (panelDecorEl.style.display === 'block') {
      const d = pickDecor(mouse.x, mouse.y);
      if (d && e.shiftKey) {
        if (removeDecor(d) && onDecorChanged) {
          onDecorChanged();
        }
        return;
      }
      placeDecor(mouse.x, mouse.y);
      if (onDecorChanged) {
        onDecorChanged();
      }
    }
  });

  canvas.addEventListener('contextmenu', e => {
    if (panelDecorEl.style.display !== 'block') {
      return;
    }
    const d = pickDecor(mouse.x, mouse.y);
    if (d) {
      e.preventDefault();
      if (removeDecor(d) && onDecorChanged) {
        onDecorChanged();
      }
    }
  });

  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'f' || e.key === 'F') {
      modeRef.value = 'food';
      addPellet(mouse.x, mouse.y);
    }
  });
}
