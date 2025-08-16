// ===============================
// src/creatures/constants.ts
// ===============================
export const MENU_BAR_HEIGHT = 48;
export const BOUNDARY_PAD = 10;

// Life defaults used if species doesn't override
export const LIFE_DEFAULT = {
  RISE_SPEED: 20,   // px/s upward (y-)
  OFF_Y: -20,       // despawn when y < this
};

// Feeding tunables
export const FEEDING = {
  SENSE_PIXEL_PER_GENE: 20, // 0..9 -> 0..180px
  GROWTH_PER_PELLET: 2,     // size increase
  CORPSE_BITE_RADIUS: 3,
  CORPSE_GROWTH: 1,
  FLEE_DIST_PIXELS: 80,
};
