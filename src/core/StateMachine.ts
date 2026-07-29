import { EventBus } from './EventBus';

export type StateTransitionHandler<S extends string> = (
  from: S | null,
  to: S
) => void | Promise<void>;

export class StateMachine<S extends string> {
  private current: S | null = null;
  private readonly transitions: Map<S, readonly S[]>;
  private readonly onTransition?: StateTransitionHandler<S>;
  private readonly eventBus?: EventBus;

  constructor(
    initial: S,
    allowedTransitions: Record<S, readonly S[]>,
    options?: {
      onTransition?: StateTransitionHandler<S>;
      eventBus?: EventBus;
      eventName?: string;
    }
  ) {
    this.current = initial;
    this.transitions = new Map(
      Object.entries(allowedTransitions) as [S, readonly S[]][]
    );
    this.onTransition = options?.onTransition;
    this.eventBus = options?.eventBus;
  }

  get state(): S | null {
    return this.current;
  }

  canTransition(to: S): boolean {
    if (this.current === null) return false;
    const allowed = this.transitions.get(this.current);
    return allowed?.includes(to) ?? false;
  }

  async transition(to: S): Promise<boolean> {
    if (!this.canTransition(to)) {
      console.warn(`Invalid transition: ${this.current} -> ${to}`);
      return false;
    }

    const from = this.current;
    this.current = to;

    await this.onTransition?.(from, to);
    this.eventBus?.emit('state:changed', { from, to });

    return true;
  }

  reset(to: S): void {
    this.current = to;
  }
}

export enum GameState {
  BOOT = 'BOOT',
  READY = 'READY',
  SPINNING = 'SPINNING',
  WIN = 'WIN',
  CTA = 'CTA',
}

export const GAME_TRANSITIONS: Record<GameState, readonly GameState[]> = {
  [GameState.BOOT]: [GameState.READY],
  [GameState.READY]: [GameState.SPINNING],
  [GameState.SPINNING]: [GameState.WIN],
  [GameState.WIN]: [GameState.CTA],
  [GameState.CTA]: [GameState.READY],
};
