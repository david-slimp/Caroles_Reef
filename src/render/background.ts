// /src/render/background.ts
import { THEMES, type ThemeId } from '../config/themes';
import { BACKGROUNDS, type BackgroundId } from '../config/backgrounds';

// Cache for loaded images
const imageCache = new Map<string, HTMLImageElement>();

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (imageCache.has(url)) {
      const cachedImg = imageCache.get(url);
      if (cachedImg && cachedImg.complete) {
        return resolve(cachedImg);
      }
    }

    const img = new Image();
    img.src = url;
    
    img.onload = () => {
      imageCache.set(url, img);
      resolve(img);
    };
    
    img.onerror = (e) => {
      console.error('Failed to load background image:', url, e);
      reject(e);
    };
  });
}

export async function drawBackground(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  theme: ThemeId | string
) {
  const key = String(theme).trim() as keyof typeof THEMES;
  const spec = THEMES[key] ?? THEMES.day; // fallback so we never crash

  // Handle custom image background if specified in the theme (preferred)
  if (spec.background) {
    const bgConfig = BACKGROUNDS[spec.background as BackgroundId];
    if (bgConfig?.type === 'custom-image' && bgConfig.imageUrl) {
      try {
        const img = await loadImage(bgConfig.imageUrl);
        // Clear the canvas and draw the image
        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(img, 0, 0, W, H);
        return; // Skip gradient if image is used
      } catch (e) {
        console.warn('Using fallback gradient background due to image load error');
      }
    }
  }
  
  // Fallback to gradient background
  if (spec.stops) {
    const grd = ctx.createLinearGradient(0, 0, 0, H);
    for (const [stop, color] of spec.stops) {
      grd.addColorStop(stop as number, color as string);
    }
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
  }
}
