import { EventBus, GameEvents } from '@/core/EventBus';

type SoundKey = 'spin' | 'win' | 'coins' | 'button';

interface SoundConfig {
  volume: number;
  loop: boolean;
}

const DEFAULT_SOUND_CONFIG: Record<SoundKey, SoundConfig> = {
  spin: { volume: 0.6, loop: true },
  win: { volume: 0.8, loop: false },
  coins: { volume: 0.7, loop: false },
  button: { volume: 0.5, loop: false },
};


/* TODO: sounds in src/assets/sounds/ */

export class SoundSystem {
  private readonly buffers = new Map<SoundKey, HTMLAudioElement>();
  private unlocked = false;
  private muted = false;
  private readonly unsubscribers: Array<() => void> = [];

  constructor(private readonly getSoundUrl: (key: string) => string | undefined) {}

  init(eventBus: EventBus): void {
    this.unsubscribers.push(
      eventBus.on(GameEvents.SPIN_STARTED, () => this.play('spin')),
      eventBus.on(GameEvents.SPIN_COMPLETE, () => {
        this.stop('spin');
        this.play('win');
      }),
      eventBus.on(GameEvents.CTA_PLAY, () => this.play('button')),
      eventBus.on(GameEvents.CTA_REPLAY, () => this.play('button'))
    );

    this.unsubscribers.push(
      listenOnce(document, 'pointerdown', () => this.unlock())
    );
  }

  unlock(): void {
    if (this.unlocked) return;
    this.unlocked = true;

    try {
      for (const key of Object.keys(DEFAULT_SOUND_CONFIG) as SoundKey[]) {
        const url = this.getSoundUrl(key);
        if (!url) continue;
        const audio = new Audio(url);
        audio.volume = 0;
        audio.play().then(() => audio.pause()).catch(() => undefined);
        this.buffers.set(key, audio);
      }
    } catch {
      // missing sound assets must never block gameplay
    }
  }

  play(key: SoundKey): void {
    if (this.muted || !this.unlocked) return;

    try {
      const url = this.getSoundUrl(key);
      if (!url) return;

      let audio = this.buffers.get(key);
      if (!audio) {
        audio = new Audio(url);
        this.buffers.set(key, audio);
      }

      const config = DEFAULT_SOUND_CONFIG[key];
      audio.volume = config.volume;
      audio.loop = config.loop;
      audio.currentTime = 0;
      audio.play().catch(() => undefined);
    } catch {
      // graceful no-op when sound url resolver fails.
    }
  }

  playCoins(): void {
    this.play('coins');
  }

  stop(key: SoundKey): void {
    const audio = this.buffers.get(key);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      for (const audio of this.buffers.values()) audio.pause();
    }
  }

  destroy(): void {
    for (const unsub of this.unsubscribers) unsub();
    this.unsubscribers.length = 0;
    for (const audio of this.buffers.values()) {
      audio.pause();
      audio.src = '';
    }
    this.buffers.clear();
  }
}

function listenOnce(target: EventTarget, event: string, handler: EventListener): () => void {
  const wrapped: EventListener = (e) => {
    handler(e);
    target.removeEventListener(event, wrapped);
  };
  target.addEventListener(event, wrapped, { once: true });
  return () => target.removeEventListener(event, wrapped);
}
