// /src/entities/decor.ts
// @ts-nocheck (you can remove later)
import type { Decor } from '../state/types';

type Env = {
  getSize: () => { W: number; H: number };
  ctx: CanvasRenderingContext2D;
  decors: Decor[];               // <— typed list
  toast: (msg: string) => void;
  rand: (a:number,b:number)=>number;
};
let env: Env;

export function configureDecor(e: Env) { env = e; }

export const decorSelect = { type: 'plant', size: 'm' as const };

export function decorRadius(size: 's'|'m'|'l'){ return size==='s'?30:size==='m'?50:80; }

const uuid = (() => { let i=0; return () => (++i).toString(36)+'-'+Date.now().toString(36); })();

export function placeDecor(x:number, y:number): Decor {
  const r = decorRadius(decorSelect.size);
  const d: Decor = { id: uuid(), type: decorSelect.type, x, y, r, size: decorSelect.size };
  env.decors.push(d);
  env.toast(`Placed ${decorSelect.type}`);
  return d;
}

export function nearDecorType(x:number,y:number,type: Decor['type'],rad?:number){
  return env.decors.some(d => d.type===type && Math.hypot(d.x-x, d.y-y) <= (rad || d.r));
}
