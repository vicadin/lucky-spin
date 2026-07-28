import { EventBus, GameEvents } from '@/core/EventBus';
import { listen } from '@/utils/dom';

type RafCallback = (deltaMs: number, elapsedMs: number) => void;

interface RafEntry {
  id: number;
  callback: RafCallback;
  startTime: number;
}

export class AnimationSystem {
  private rafId: number | null = null;
  private lastTimestamp = 0;
  private paused = false;
  private readonly entries = new Map<number, RafEntry>();
  private nextId = 1;
  private readonly unsubscribers: Array<() => void> = [];

  init(eventBus: EventBus): void {
    this.unsubscribers.push(
      listen(document, 'visibilitychange', () => {
        const hidden = document.hidden;
        this.paused = hidden;
        eventBus.emit(GameEvents.VISIBILITY_CHANGED, { hidden });
        if (!hidden && this.entries.size > 0) this.startLoop();
      })
    );
  }

  onFrame(callback: RafCallback): () => void {
    const id = this.nextId++;
    this.entries.set(id, { id, callback, startTime: performance.now() });

    if (this.rafId === null) this.startLoop();

    return () => {
      this.entries.delete(id);
      if (this.entries.size === 0) this.stopLoop();
    };
  }

  animateNumber(
    from: number,
    to: number,
    durationMs: number,
    onUpdate: (value: number) => void,
    ease: (t: number) => number = (t) => t
  ): Promise<void> {
    return new Promise((resolve) => {
      const start = performance.now();
      const cancel = this.onFrame(() => {
        const elapsed = performance.now() - start;
        const t = Math.min(elapsed / durationMs, 1);
        const value = from + (to - from) * ease(t);
        onUpdate(value);
        if (t >= 1) {
          cancel();
          resolve();
        }
      });
    });
  }

  shake(
    element: HTMLElement,
    intensity: number,
    durationMs: number
  ): Promise<void> {
    return new Promise((resolve) => {
      const start = performance.now();
      const cancel = this.onFrame(() => {
        const elapsed = performance.now() - start;
        if (elapsed >= durationMs) {
          element.style.transform = '';
          cancel();
          resolve();
          return;
        }
        const decay = 1 - elapsed / durationMs;
        const x = (Math.random() - 0.5) * 2 * intensity * decay;
        const y = (Math.random() - 0.5) * 2 * intensity * decay;
        element.style.transform = `translate(${x}px, ${y}px)`;
      });
    });
  }

  destroy(): void {
    this.stopLoop();
    this.entries.clear();
    for (const unsub of this.unsubscribers) unsub();
    this.unsubscribers.length = 0;
  }

  private startLoop(): void {
    if (this.rafId !== null) return;
    this.lastTimestamp = performance.now();

    const tick = (timestamp: number): void => {
      if (this.paused || this.entries.size === 0) {
        this.rafId = requestAnimationFrame(tick);
        return;
      }

      const delta = timestamp - this.lastTimestamp;
      this.lastTimestamp = timestamp;

      for (const entry of this.entries.values()) {
        const elapsed = timestamp - entry.startTime;
        entry.callback(delta, elapsed);
      }

      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  private stopLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
