// /src/config/backgrounds.ts

export type BackgroundStyle = 'gradient' | 'coral-reef' | 'custom-image' | 'future';

export interface BackgroundConfig {
  type: BackgroundStyle;
  // For gradient backgrounds
  stops?: [number, string][];
  // For custom image
  imageUrl?: string;
  // For future extensions
  [key: string]: any;
}

export const BACKGROUNDS: Record<string, BackgroundConfig> = {
  gradient: {
    type: 'gradient',
    stops: [
      [0, '#7ec8ff'],
      [0.5, '#59a8e6'],
      [1, '#2a6db6'],
    ],
  },
  'coral-reef': {
    type: 'coral-reef',
    // Coral reef will be drawn programmatically
  },
  'custom-image': {
    type: 'custom-image',
    imageUrl: './images/tank_background01.png',
  },
  future: {
    type: 'future',
    // Placeholder for future background types
  },
};

export type BackgroundId = keyof typeof BACKGROUNDS;

export const DEFAULT_BACKGROUND: BackgroundId = 'custom-image';
