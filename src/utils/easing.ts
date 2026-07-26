export type EasingFn = (t: number) => number;

export const easeOutCubic: EasingFn = (t) => 1 - Math.pow(1 - t, 3);

export const easeInOutCubic: EasingFn = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const easeOutQuart: EasingFn = (t) => 1 - Math.pow(1 - t, 4);

export const easeOutExpo: EasingFn = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

export const wheelSpinEase: EasingFn = (t) => {
  const fastPhase = 0.5;
  const fastProgress = 0.82;

  if (t < fastPhase) {
    return (t / fastPhase) * fastProgress;
  }

  const tail = (t - fastPhase) / (1 - fastPhase);
  return fastProgress + easeOutExpo(tail) * (1 - fastProgress);
};

export const anticipationEase: EasingFn = (t) => {
  if (t < 0.35) return easeOutQuart(t / 0.35) * 0.55;
  return 0.55 + easeOutExpo((t - 0.35) / 0.65) * 0.45;
};

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
