import { Button } from '@/components/Button/Button';
import { Counter } from '@/components/Counter/Counter';
import { Particles } from '@/components/Particles/Particles';
import { Popup } from '@/components/Popup/Popup';
import { Wheel } from '@/components/Wheel/Wheel';
import { GAME_CONFIG } from '@/config/gameConfig';
import { initAdBridge, openStore } from '@/core/AdBridge';
import { AssetLoader } from '@/core/AssetLoader';
import { EventBus, GameEvents } from '@/core/EventBus';
import { initMraidBridge } from '@/core/MraidBridge';
import {
  GAME_TRANSITIONS,
  GameState,
  StateMachine,
} from '@/core/StateMachine';
import { AnimationSystem } from '@/systems/AnimationSystem';
import { RewardSystem, type RewardResult } from '@/systems/RewardSystem';
import { SoundSystem } from '@/systems/SoundSystem';
import { createElement, qs } from '@/utils/dom';
import { randomInt } from '@/utils/random';

export class Game {
  private readonly eventBus = new EventBus();
  private readonly assetLoader = new AssetLoader();
  private readonly animationSystem = new AnimationSystem();
  private readonly rewardSystem = new RewardSystem();
  private readonly soundSystem: SoundSystem;
  private readonly stateMachine: StateMachine<GameState>;

  private root!: HTMLElement;
  private gameLayer!: HTMLElement;
  private wheel!: Wheel;
  private spinButton!: Button;
  private counter!: Counter;
  private popup!: Popup;
  private particles!: Particles;
  private tapHint!: HTMLElement;
  private winOverlay!: HTMLElement;
  private hintEl!: HTMLElement;

  private currentReward: RewardResult | null = null;
  private tapHintTimer: ReturnType<typeof setTimeout> | null = null;
  private unsubscribers: Array<() => void> = [];

  constructor(private readonly container: HTMLElement) {
    this.soundSystem = new SoundSystem((key) => this.assetLoader.getSoundUrl(key));
    this.stateMachine = new StateMachine(GameState.BOOT, GAME_TRANSITIONS, {
      eventBus: this.eventBus,
    });
  }

  async start(): Promise<void> {
    await initMraidBridge();
    await initAdBridge();

    this.buildDOM();
    this.wireEvents();

    this.animationSystem.init(this.eventBus);
    this.soundSystem.init(this.eventBus);

    await this.assetLoader.load();
    this.applyAssets();
    this.eventBus.emit(GameEvents.ASSETS_LOADED);

    await this.stateMachine.transition(GameState.READY);
    this.onReady();
  }

  destroy(): void {
    if (this.tapHintTimer) clearTimeout(this.tapHintTimer);
    for (const unsub of this.unsubscribers) unsub();
    this.unsubscribers.length = 0;
    this.wheel?.destroy();
    this.particles?.destroy();
    this.popup?.destroy();
    this.spinButton?.destroy();
    this.animationSystem.destroy();
    this.soundSystem.destroy();
    this.assetLoader.destroy();
    this.eventBus.clear();
  }

  private buildDOM(): void {
    this.root = createElement('div', 'game');
    this.gameLayer = createElement('div', 'game__layer');

    const bg = createElement('div', 'game__background');
    const bgImg = createElement('div', 'game__background-image');
    bg.appendChild(bgImg);

    const header = createElement('header', 'game__header');
    const title = createElement('h1', 'game__title');
    title.textContent = GAME_CONFIG.copy.title;
    header.appendChild(title);

    const logo = createElement('div', 'game__logo');
    header.appendChild(logo);

    this.wheel = new Wheel(this.assetLoader);
    this.spinButton = new Button({
      label: GAME_CONFIG.copy.spinButton,
      variant: 'primary',
      className: 'spin-button',
    });
    this.spinButton.setEnabled(false);

    this.hintEl = createElement('p', 'game__hint');
    this.hintEl.textContent = GAME_CONFIG.copy.hint;

    this.tapHint = createElement('div', 'game__tap-hint');
    this.tapHint.textContent = GAME_CONFIG.copy.tapHint;

    this.winOverlay = createElement('div', 'game__win-overlay');
    const winBackdrop = createElement('div', 'game__win-backdrop');
    const winContent = createElement('div', 'game__win-content');
    this.counter = new Counter(GAME_CONFIG.copy.winPrefix);
    winContent.appendChild(this.counter.element);
    this.winOverlay.append(winBackdrop, winContent);

    this.particles = new Particles(this.gameLayer);
    this.popup = new Popup();

    const wheelWrap = createElement('div', 'game__wheel-wrap');
    wheelWrap.appendChild(this.wheel.element);
    wheelWrap.appendChild(this.tapHint);

    this.gameLayer.append(bg, header, wheelWrap, this.spinButton.element, this.hintEl);
    this.root.append(this.gameLayer, this.winOverlay, this.particles.element, this.popup.element);
    this.container.appendChild(this.root);
  }

  private applyAssets(): void {
    const bgUrl = this.assetLoader.getImageUrl('background');
    if (bgUrl) {
      const bgEl = qs<HTMLElement>('.game__background-image', this.root);
      bgEl.style.backgroundImage = `url(${bgUrl})`;
    }

    const logoUrl = this.assetLoader.getImageUrl('logo');
    if (logoUrl) {
      const logoEl = qs<HTMLElement>('.game__logo', this.root);
      logoEl.style.backgroundImage = `url(${logoUrl})`;
    }

    const spinBtnUrl = this.assetLoader.getImageUrl('button-spin');
    if (spinBtnUrl) {
      this.spinButton.setBackgroundImage(spinBtnUrl);
    }
  }

  private wireEvents(): void {
    this.unsubscribers.push(
      this.spinButton.onClick(() => void this.onSpinClick()),
      this.popup.onPlayNow(() => {
        this.eventBus.emit(GameEvents.CTA_PLAY);
        openStore();
      }),
      this.popup.onSpinAgain(() => {
        this.eventBus.emit(GameEvents.CTA_REPLAY);
        void this.onReplay();
      }),
      this.eventBus.on<{ to: GameState }>(GameEvents.STATE_CHANGED, ({ to }) => {
        void this.onStateChange(to);
      })
    );
  }

  private onReady(): void {
    this.spinButton.setEnabled(true);
    this.spinButton.startPulse();
    this.particles.startAmbient();

    this.tapHintTimer = setTimeout(() => {
      this.tapHint.classList.add('is-visible');
    }, GAME_CONFIG.tapHintDelayMs);
  }

  private async onSpinClick(): Promise<void> {
  if (!this.stateMachine.canTransition(GameState.SPINNING)) {
    return;
  }

  this.tapHint.classList.remove('is-visible');

  if (this.tapHintTimer) {
    clearTimeout(this.tapHintTimer);
    this.tapHintTimer = null;
  }

  this.currentReward = this.rewardSystem.pickReward();

  await this.stateMachine.transition(GameState.SPINNING);

  const duration = randomInt(
    GAME_CONFIG.spinDurationMin,
    GAME_CONFIG.spinDurationMax
  );

  this.eventBus.emit(GameEvents.SPIN_STARTED);

  await this.wheel.spinToSegment(this.currentReward.segmentIndex, {
    durationMs: duration,
    minRotations: GAME_CONFIG.spinMinRotations,
    useAnticipation: false,
    anticipationPauseMs: 0,
    jackpotIndex: -1,
  });

  this.eventBus.emit(
    GameEvents.SPIN_COMPLETE,
    this.currentReward
  );

  await this.stateMachine.transition(GameState.WIN);
}

  private async onStateChange(state: GameState): Promise<void> {
    switch (state) {
      case GameState.SPINNING:
        this.spinButton.setEnabled(false);
        this.wheel.stopIdle();
        this.spinButton.stopPulse();
        break;

      case GameState.WIN:
        await this.playWinSequence();
        await this.stateMachine.transition(GameState.CTA);
        break;

      case GameState.CTA:
        this.winOverlay.classList.remove('is-visible');
        this.popup.show();
        this.eventBus.emit(GameEvents.CTA_SHOWN);
        break;

      case GameState.READY:
        this.spinButton.setEnabled(true);
        this.winOverlay.classList.remove('is-visible');
        this.popup.hide();
        this.spinButton.startPulse();
        this.particles.startAmbient();
        break;
    }
  }

  private async playWinSequence(): Promise<void> {
    if (!this.currentReward) return;

    const { multiplier } = this.currentReward.segment;

    this.winOverlay.classList.add('is-visible');
    this.gameLayer.classList.add('is-glowing');
    this.counter.setValue(0);

    this.soundSystem.playCoins();
    this.particles.burstConfetti(GAME_CONFIG.confettiCount);
    this.particles.burstCoins(GAME_CONFIG.coinBurstCount);

    await Promise.all([
      this.animationSystem.shake(
        this.gameLayer,
        GAME_CONFIG.shakeIntensity,
        GAME_CONFIG.shakeDurationMs
      ),
      this.counter.animateTo(multiplier, GAME_CONFIG.winCounterDurationMs),
    ]);

    this.eventBus.emit(GameEvents.WIN_SHOWN, this.currentReward);
    await this.delay(GAME_CONFIG.winSequenceDelayBeforeCtaMs);
    this.gameLayer.classList.remove('is-glowing');
  }

  private async onReplay(): Promise<void> {
    this.popup.hide();
    await this.stateMachine.transition(GameState.READY);
    this.onReady();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
