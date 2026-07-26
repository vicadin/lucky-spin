export const GAME_CONFIG = {
  designWidth: 390,
  designHeight: 844,

  spinDurationMin: 3000,
  spinDurationMax: 4000,

  spinMinRotations: 6,

  anticipationPauseMs: 400,
  anticipationOvershootDeg: 8,

  tapHintDelayMs: 1000,

  winCounterDurationMs: 1800,
  winSequenceDelayBeforeCtaMs: 2200,

  shakeIntensity: 6,
  shakeDurationMs: 500,

  confettiCount: 40,
  coinBurstCount: 16,

  copy: {
    title: 'SPIN & WIN!',
    spinButton: 'SPIN',
    hint: 'Win up to x1000!',
    tapHint: 'Tap to spin!',
    winPrefix: 'YOU WON',
    ctaTitle: 'Amazing!',
    ctaBody: 'Install now and win even more rewards!',
    playNow: 'PLAY NOW',
    spinAgain: 'SPIN AGAIN',
  },
} as const;

export type GameConfig = typeof GAME_CONFIG;
