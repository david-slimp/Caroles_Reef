// ===============================
// src/creatures/index.ts
// ===============================
export * from "./types";
export * from "./registry";
export * from "./factory";
export { updateMovement } from "./movement";
export { handleFeeding } from "./feeding";
export { drawCreature } from "./rendering";
export { isAdult, tryStartRitual, advanceRitual } from "./breeding";

