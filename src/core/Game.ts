import { Button } from '@/components/Button/Button';
import { Wheel } from '@/components/Wheel/Wheel';
import { GAME_CONFIG } from '@/config/gameConfig';
import { initAdBridge } from '@/core/AdBridge';
import { AssetLoader } from '@/core/AssetLoader';
import { EventBus, GameEvents } from '@/core/EventBus';
import { initMraidBridge } from '@/core/MraidBridge';

import { AnimationSystem } from '@/systems/AnimationSystem';
import { createElement, qs } from '@/utils/dom';

export class Game {
  private readonly eventBus = new EventBus();
  private readonly assetLoader = new AssetLoader();
  private readonly animationSystem = new AnimationSystem();

  private root!: HTMLElement;
  private gameLayer!: HTMLElement;
  private wheel!: Wheel;
  private spinButton!: Button;
  private tapHint!: HTMLElement;

  private tapHintTimer: ReturnType<typeof setTimeout> | null = null;
  private unsubscribers: Array<() => void> = [];


  async start(): Promise<void> {
    await initMraidBridge();
    await initAdBridge();

    this.buildDOM();

    this.animationSystem.init(this.eventBus);

    await this.assetLoader.load();
    this.applyAssets();
    this.eventBus.emit(GameEvents.ASSETS_LOADED);

    this.onReady();
  }

  destroy(): void {
    if (this.tapHintTimer) clearTimeout(this.tapHintTimer);
    for (const unsub of this.unsubscribers) unsub();
    this.unsubscribers.length = 0;
    this.wheel?.destroy();
    this.spinButton?.destroy();
    this.animationSystem.destroy();
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

    const wheelWrap = createElement('div', 'game__wheel-wrap');
    wheelWrap.appendChild(this.wheel.element);
    wheelWrap.appendChild(this.tapHint);

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

  private onReady(): void {
    this.spinButton.setEnabled(true);
    this.spinButton.startPulse();

  }
}
