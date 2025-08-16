// ===============================
// src/core/env.ts
// ===============================
export type Env = {
  getSize: () => { W: number; H: number };
  ctx: CanvasRenderingContext2D;
  pellets: any[];
  decors: any[];
  creatures: any[]; // unified list of all species
  toast?: (msg: string) => void;
  maxCreatures?: number;
};

let _env: Env | null = null;
export function setEnv(e: Env) { _env = e; }
export function getEnv(): Env { if(!_env) throw new Error("env not set"); return _env; }

