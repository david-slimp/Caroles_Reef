// ===============================
// src/creatures/movement.ts
// ===============================
import type { CreatureBase } from "./types";
import { getSpecies } from "./registry";
import { clamp, rand } from "./utils";

export function updateMovement(c: CreatureBase, dt:number){
  const spec = getSpecies(c.speciesId);
  const mv = spec.movement;

  // init local state
  const s:any = (c as any);
  if(!s._home){ s._home = {x:c.x,y:c.y}; s._mvT = 0; s._mvGoal = c.dir; }
  const home = s._home as {x:number;y:number};

  // If fleeing, set heading straight away from source until distance quota met
  if(c.state === "flee" && (c._fleeDistLeft ?? 0) > 0 && c._fleeFromX != null && c._fleeFromY != null){
    const away = Math.atan2(c.y - c._fleeFromY!, c.x - c._fleeFromX!);
    c.dir = away;
    const speed = mv.vmax * 0.9;
    c.vx = Math.cos(c.dir) * speed;
    c.vy = Math.sin(c.dir) * speed;
    const step = Math.hypot(c.vx*dt, c.vy*dt);
    c._fleeDistLeft = Math.max(0, (c._fleeDistLeft||0) - step);
    if(c._fleeDistLeft === 0) c.state = "wander";
  } else {
    // periodic retarget with slight home bias
    s._mvT -= dt;
    if(s._mvT <= 0){
      s._mvT = rand(0.8, 1.6);
      const toHome = Math.atan2(home.y - c.y, home.x - c.x);
      const jitter = rand(-0.9, 0.9);
      s._mvGoal = toHome + jitter;
    }

    // turn toward goal with capped rate
    const dy = Math.atan2(Math.sin(s._mvGoal - c.dir), Math.cos(s._mvGoal - c.dir));
    const step = mv.turnRate * dt;
    c.dir += clamp(dy, -step, step);

    // forward-only velocity
    const speed = mv.vmax * 0.5; // gentle pace
    c.vx = Math.cos(c.dir) * speed;
    c.vy = Math.sin(c.dir) * speed * 0.8;

    // integrate
    c.x += c.vx * dt;
    c.y += c.vy * dt;

    // soft leash to home
    const dx = c.x - home.x, dy2 = c.y - home.y; const r = Math.hypot(dx, dy2);
    if(r > mv.homeRadius){ c.dir = Math.atan2(home.y - c.y, home.x - c.x); }
  }

  spec.hooks?.movementTick?.(c, dt);
}
