// src/render/decorRenderer.ts

import type { Decor } from '../state/types';

type Env = {
  ctx: CanvasRenderingContext2D;
  getSize: () => { W: number; H: number };
  decors: ReadonlyArray<Decor>;
  rand: (a: number, b: number) => number;
  showDebugRadius?: () => boolean;
};

let env: Env;

export function configureDecorRenderer(e: Env) {
  env = e;
}

export function drawDecor() {
  const { ctx, decors, rand } = env;
  const visualRadiusForSize = (size?: 's' | 'm' | 'l') =>
    size === 's' ? 30 : size === 'm' ? 50 : 80;

  decors.forEach(d => {
    const visualR = visualRadiusForSize(d.size);
    ctx.save();
    ctx.translate(d.x, d.y);

    if (env.showDebugRadius?.()) {
      // TEMP DEBUG: visualize decor radius (remove after sizing review).
      ctx.strokeStyle = 'rgba(255, 230, 80, 0.9)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, d.r, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (d.type === 'plant') {
      ctx.strokeStyle = 'rgba(80,255,120,0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.save();
      ctx.translate(0, visualR);
      for (let i = 0; i < 5; i++) {
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-10 + i * 5, -visualR * 0.6, rand(-5, 5), -visualR * 2);
      }
      ctx.stroke();
      ctx.restore();
    } else if (d.type === 'coral') {
      ctx.fillStyle = 'rgba(255,120,180,0.8)';
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(
          rand(-visualR * 0.5, visualR * 0.5),
          rand(-visualR * 0.4, visualR * 0.2),
          rand(6, 12),
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    } else if (d.type === 'rock') {
      ctx.fillStyle = 'rgba(60,60,70,0.9)';
      ctx.beginPath();
      ctx.ellipse(0, 0, visualR * 0.6, visualR * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (d.type === 'chest') {
      ctx.fillStyle = 'rgba(170,120,40,0.95)';
      ctx.fillRect(-visualR * 0.4, -visualR * 0.2, visualR * 0.8, visualR * 0.4);
      ctx.fillStyle = 'rgba(240,200,60,0.9)';
      ctx.fillRect(-visualR * 0.4, -visualR * 0.22, visualR * 0.8, 4);
    }

    ctx.restore();
  });
}
