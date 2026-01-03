// src/render/eyeRenderer.ts

export type EyeRenderParams = {
  ctx: CanvasRenderingContext2D;
  eyeType?: string;
  x: number;
  y: number;
  bodyLen: number;
  bodyHt: number;
  size?: number;
  colorHue?: number;
  timeMs?: number;
  idSeed?: string | number;
};

const WINK_CLOSED_MS = 1000;
const WINK_OPEN_MS = 10000;
const WINK_CLOSE_MS = 200;
const WINK_OPENING_MS = 200;
const WINK_CYCLE_MS = WINK_CLOSED_MS + WINK_OPEN_MS;

const TWINKLE_MIN = 0;
const TWINKLE_MAX = 1;

export function drawEye(params: EyeRenderParams) {
  const {
    ctx,
    eyeType,
    x,
    y,
    bodyHt,
    size,
    timeMs = typeof performance !== 'undefined' ? performance.now() : Date.now(),
    idSeed,
  } = params;

  const type = eyeType || 'round';
  const baseRadius = Math.max(2, bodyHt * 0.12);
  const pupilBase = Math.max(1, bodyHt * 0.06);
  const sparkleBoost = type === 'sparkly' && typeof size === 'number' && size >= 10 ? 1 : 0;
  const radius = baseRadius + sparkleBoost;
  const phaseMs = phaseOffsetMs(timeMs, idSeed);

  if (type === 'winking') {
    const lid = winkLidAmount(phaseMs);
    drawEyeOpen(ctx, x, y, radius, 1 - 0.85 * lid);
    if (lid < 0.7) {
      drawPupil(ctx, x, y, pupilBase);
    }
    if (lid > 0.6) {
      drawClosedLid(ctx, x, y, radius);
    }
    return;
  }

  drawEyeOpen(ctx, x, y, radius, 1);

  if (type === 'sleepy') {
    drawSleepyEye(ctx, x, y, radius, pupilBase, bodyHt, params.colorHue);
    return;
  }

  if (type === 'sparkly') {
    drawSparkleSpecks(ctx, x, y, radius, phaseMs);
    drawPupil(ctx, x, y, Math.max(1, pupilBase * 1.25));
    drawSparkleHighlights(ctx, x, y, radius, phaseMs);
  } else {
    drawPupil(ctx, x, y, pupilBase);
  }
}

function phaseOffsetMs(timeMs: number, seed?: string | number) {
  if (seed == null) return timeMs % WINK_CYCLE_MS;
  const offset = hashToUnit(seed) * WINK_CYCLE_MS;
  return (timeMs + offset) % WINK_CYCLE_MS;
}

function winkLidAmount(phaseMs: number) {
  if (phaseMs >= WINK_CLOSED_MS) return 0;
  if (phaseMs < WINK_CLOSE_MS) return phaseMs / WINK_CLOSE_MS;
  if (phaseMs < WINK_CLOSED_MS - WINK_OPENING_MS) return 1;
  return 1 - (phaseMs - (WINK_CLOSED_MS - WINK_OPENING_MS)) / WINK_OPENING_MS;
}

function drawEyeOpen(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  scaleY: number
) {
  const clampedScale = Math.max(0.15, Math.min(1, scaleY));
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, clampedScale);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPupil(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(x + 1, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawSleepyEye(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  pupilRadius: number,
  bodyHt: number,
  colorHue?: number
) {
  const lidY = y - radius * 0.15;
  const lidColor = typeof colorHue === 'number' ? `hsl(${colorHue} 55% 30%)` : 'rgba(0,0,0,0.45)';

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.rect(x - radius * 1.2, y, radius * 2.4, radius * 2);
  ctx.clip();
  drawPupil(ctx, x, y + radius * 0.25, Math.max(1, pupilRadius * 0.8));
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = lidColor;
  ctx.beginPath();
  ctx.arc(x, lidY, radius * 1.05, Math.PI, 0, false);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = Math.max(1, bodyHt * 0.02);
  ctx.beginPath();
  ctx.arc(x, lidY, radius * 0.95, Math.PI * 0.12, Math.PI * 0.88);
  ctx.stroke();
  ctx.restore();
}

function drawClosedLid(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.save();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = Math.max(1, radius * 0.12);
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.9, Math.PI * 0.2, Math.PI * 0.8);
  ctx.stroke();
  ctx.restore();
}

function drawSparkleSpecks(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  phaseMs: number
) {
  const phase = (phaseMs % WINK_CYCLE_MS) / WINK_CYCLE_MS;
  const flash = flashAlpha(phase);
  const alpha = TWINKLE_MIN + (TWINKLE_MAX - TWINKLE_MIN) * flash;
  if (alpha <= 0.02) return;
  const spark = Math.max(4, radius * 2.4);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = Math.max(1, radius * 0.28);

  ctx.beginPath();
  ctx.moveTo(x - spark, y);
  ctx.lineTo(x + spark, y);
  ctx.moveTo(x, y - spark);
  ctx.lineTo(x, y + spark);
  ctx.stroke();

  const dx = -radius * 0.75;
  const dy = -radius * 0.75;
  const sparkSmall = spark * 0.6;
  ctx.beginPath();
  ctx.moveTo(x + dx - sparkSmall, y + dy);
  ctx.lineTo(x + dx + sparkSmall, y + dy);
  ctx.moveTo(x + dx, y + dy - sparkSmall);
  ctx.lineTo(x + dx, y + dy + sparkSmall);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x - radius * 0.4, y + radius * 0.3, Math.max(3, radius * 0.45), 0, Math.PI * 2);
  ctx.arc(x + radius * 0.25, y + radius * 0.5, Math.max(3, radius * 0.35), 0, Math.PI * 2);
  ctx.arc(x + radius * 1.25, y - radius * 0.2, Math.max(3, radius * 0.3), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSparkleHighlights(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  phaseMs: number
) {
  const phase = (phaseMs % WINK_CYCLE_MS) / WINK_CYCLE_MS;
  const alpha = flashAlpha(phase);
  if (alpha <= 0.02) return;
  ctx.save();
  ctx.globalAlpha = Math.max(0.15, alpha);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x - radius * 0.32, y - radius * 0.32, Math.max(1, radius * 0.22), 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = Math.max(0.12, alpha * 0.7);
  ctx.beginPath();
  ctx.arc(x + radius * 0.12, y - radius * 0.08, Math.max(1, radius * 0.16), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function hashToUnit(seed: string | number) {
  const str = String(seed);
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function flashAlpha(phase: number) {
  const flashWidth = 0.08;
  const center = 0.15;
  const dist = Math.abs(phase - center);
  const pulse = Math.max(0, 1 - dist / flashWidth);
  return pulse * pulse;
}
