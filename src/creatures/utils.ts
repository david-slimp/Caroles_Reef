// ===============================
// src/creatures/utils.ts
// ===============================
export const clamp = (v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
export const rand  = (a:number,b:number)=>a+Math.random()*(b-a);
export const randi = (a:number,b:number)=>Math.floor(rand(a,b));
export const angleLerp = (a:number,b:number,t:number)=> a + Math.atan2(Math.sin(b-a), Math.cos(b-a))*t;
export const uuid = (()=>{let i=0; return ()=>`c_${(++i).toString(36)}_${Date.now().toString(36)}`;})();

