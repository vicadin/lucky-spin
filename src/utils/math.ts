import { SEGMENT_ANGLE, POINTER_OFFSET_DEG } from '@/config/wheelConfig';

export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_DEG = 180 / Math.PI;

export function normalizeAngle(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

export function rotationForSegment(
  segmentIndex: number,
  currentRotation: number,
  minFullRotations: number
): number {
  const segmentCenter = segmentIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2 - 90;
  const pointerAngle = -90 + POINTER_OFFSET_DEG;
  let delta = pointerAngle - segmentCenter - normalizeAngle(currentRotation);
  delta = normalizeAngle(delta);
  if (delta < 1) delta += 360;

  return currentRotation + minFullRotations * 360 + delta;
}

export function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number
): { x: number; y: number } {
  const rad = angleDeg * DEG_TO_RAD;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}
