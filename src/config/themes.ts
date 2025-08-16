// /src/config/themes.ts

// Optional polish (use later if you want)
// In bubbles renderer, if accent.bubbleTint exists, set ctx.globalAlpha and fillStyle from it.
// In a future post-process/vignette, darken edges slightly for super-night.
// For mermaid-glow, add a faint additive “sparkle” or soft radial glows using accent.glow1/glow2 circles at low alpha.

// TODO: Add support for stars in super-night


export type ThemeId =
  | 'day' | 'dusk' | 'night'
  | 'sunset' | 'super-night' | 'mermaid-glow';

export const THEMES = {
  day: {
    stops: [
      [0,   '#7ec8ff'],
      [0.5, '#59a8e6'],
      [1,   '#2a6db6'],
    ],
    background: 'custom-image',
  },
  dusk: {
    stops: [
      [0,   '#6a6ad1'],
      [0.5, '#4f66a8'],
      [1,   '#233c74'],
    ],
  },
  night: {
    stops: [
      [0,   '#0b1540'],
      [0.5, '#0a1c4f'],
      [1,   '#0a2a66'],
    ],
  },

  sunset: {
    stops: [
      [0,   '#FFB56B'],
      [0.5, '#D76D77'],
      [1,   '#3A1C71'],
    ],
    accent: { bubbleTint: 'rgba(255,180,120,0.30)', caustics: 'rgba(255,160,80,0.10)' }
  },

  'super-night': {
    stops: [
      [0,   '#020617'],
      [0.5, '#0B1026'],
      [1,   '#00040A'],
    ],
    accent: { bubbleTint: 'rgba(180,220,255,0.22)', stars: true }
  },

  'mermaid-glow': {
    stops: [
      [0,   '#0A0F24'],
      [0.48,'#14324A'],
      [1,   '#2B0E3F'],
    ],
    accent: { glow1:'#5FFFE3', glow2:'#FF6AD5', caustics:'rgba(95,255,227,0.08)', bubbleTint:'rgba(255,106,213,0.18)' }
  },
} as const;