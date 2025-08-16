import type { EventBus } from './events';
export function initInput(bus: EventBus, canvas: HTMLCanvasElement) {
  const m = { x: 0, y: 0, down: false };
  canvas.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    m.x = e.clientX - r.left;
    m.y = e.clientY - r.top;
    bus.emit('mouse:move', m);
  });
  canvas.addEventListener('mousedown', () => {
    m.down = true;
    bus.emit('mouse:down', m);
  });
  addEventListener('mouseup', () => {
    m.down = false;
    bus.emit('mouse:up', m);
  });
}
