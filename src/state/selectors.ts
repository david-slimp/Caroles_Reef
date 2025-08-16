import type { Creature } from '../entities/creature';
export const isAdult = (c: Creature) => c.size >= 20;
export const isYoung = (c: Creature) => c.age < 5 * 60;
