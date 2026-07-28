type EventCallback<T = unknown> = (payload: T) => void;

interface ListenerEntry {
  callback: EventCallback;
  once: boolean;
}

export class EventBus {
  private readonly listeners = new Map<string, Set<ListenerEntry>>();

  on<T = unknown>(event: string, callback: EventCallback<T>): () => void {
    return this.addListener(event, callback as EventCallback, false);
  }

  once<T = unknown>(event: string, callback: EventCallback<T>): () => void {
    return this.addListener(event, callback as EventCallback, true);
  }

  off(event: string, callback: EventCallback): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const entry of set) {
      if (entry.callback === callback) {
        set.delete(entry);
        break;
      }
    }
    if (set.size === 0) this.listeners.delete(event);
  }

  emit<T = unknown>(event: string, payload?: T): void {
    const set = this.listeners.get(event);
    if (!set) return;

    const toRemove: ListenerEntry[] = [];
    for (const entry of set) {
      entry.callback(payload);
      if (entry.once) toRemove.push(entry);
    }
    for (const entry of toRemove) set.delete(entry);
    if (set.size === 0) this.listeners.delete(event);
  }

  clear(): void {
    this.listeners.clear();
  }

  private addListener(event: string, callback: EventCallback, once: boolean): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    const entry: ListenerEntry = { callback, once };
    set.add(entry);
    return () => this.off(event, callback);
  }
}

export const GameEvents = {
  STATE_CHANGED: 'state:changed',
  ASSETS_LOADED: 'assets:loaded',
  SPIN_REQUESTED: 'spin:requested',
  SPIN_STARTED: 'spin:started',
  SPIN_COMPLETE: 'spin:complete',
  WIN_SHOWN: 'win:shown',
  CTA_SHOWN: 'cta:shown',
  CTA_PLAY: 'cta:play',
  CTA_REPLAY: 'cta:replay',
  VISIBILITY_CHANGED: 'visibility:changed',
} as const;
