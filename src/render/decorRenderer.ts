// src/render/decorRenderer.ts

import type { Decor } from '../state/types';

type Env = {
  ctx: CanvasRenderingContext2D;
  getSize: () => { W: number; H: number };
  decors: ReadonlyArray<Decor>;
  rand: (a: number, b: number) => number;
};

let env: Env;

export function configureDecorRenderer(e: Env) {
  env = e;
}

export function drawDecor() {
  const { ctx, decors, rand } = env;

  decors.forEach(d => {
    ctx.save();
    ctx.translate(d.x, d.y);

    if (d.type === 'plant') {
      ctx.strokeStyle = 'rgba(80,255,120,0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-10 + i * 5, -d.r * 0.3, rand(-5, 5), -d.r);
      }
      ctx.stroke();
    } else if (d.type === 'coral') {
      ctx.fillStyle = 'rgba(255,120,180,0.8)';
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(
          rand(-d.r * 0.5, d.r * 0.5),
          rand(-d.r * 0.4, d.r * 0.2),
          rand(6, 12),
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    } else if (d.type === 'rock') {
      ctx.fillStyle = 'rgba(60,60,70,0.9)';
      ctx.beginPath();
      ctx.ellipse(0, 0, d.r * 0.6, d.r * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (d.type === 'chest') {
      ctx.fillStyle = 'rgba(170,120,40,0.95)';
      ctx.fillRect(-d.r * 0.4, -d.r * 0.2, d.r * 0.8, d.r * 0.4);
      ctx.fillStyle = 'rgba(240,200,60,0.9)';
      ctx.fillRect(-d.r * 0.4, -d.r * 0.22, d.r * 0.8, 4);
    }

    ctx.restore();
  });
}
