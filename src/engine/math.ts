export const rand = (a: number, b: number) => Math.random() * (b - a) + a;
export const randi = (a: number, b: number) => Math.floor(rand(a, b));
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
