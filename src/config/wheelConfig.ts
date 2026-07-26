export interface WheelSegment {
  readonly id: string;
  readonly multiplier: number;
  readonly label: string;
  readonly weight: number;
  readonly color: string;
  readonly textColor: string;
}

export const WHEEL_SEGMENTS: readonly WheelSegment[] = [
  { id: 'x2', multiplier: 2, label: 'x2', weight: 28, color: '#4a90d9', textColor: '#ffffff' },
  { id: 'x5', multiplier: 5, label: 'x5', weight: 22, color: '#7b68ee', textColor: '#ffffff' },
  { id: 'x10', multiplier: 10, label: 'x10', weight: 18, color: '#50c878', textColor: '#ffffff' },
  { id: 'x25', multiplier: 25, label: 'x25', weight: 14, color: '#ffa500', textColor: '#1a1a2e' },
  { id: 'x50', multiplier: 50, label: 'x50', weight: 10, color: '#ff6b6b', textColor: '#ffffff' },
  { id: 'x100', multiplier: 100, label: 'x100', weight: 5, color: '#ffd700', textColor: '#1a1a2e' },
  { id: 'x500', multiplier: 500, label: 'x500', weight: 2, color: '#ff1493', textColor: '#ffffff' },
  { id: 'x1000', multiplier: 1000, label: 'x1000', weight: 1, color: '#9400d3', textColor: '#ffffff' },
] as const;

export const SEGMENT_ANGLE = 360 / WHEEL_SEGMENTS.length;

export const POINTER_OFFSET_DEG = 0
