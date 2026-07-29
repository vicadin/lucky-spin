import { GAME_CONFIG } from '@/config/gameConfig';
import { Button } from '@/components/Button/Button';
import { createElement } from '@/utils/dom';

export class Popup {
  readonly element: HTMLElement;
  private readonly backdrop: HTMLElement;
  private readonly playButton: Button;
  private readonly replayButton: Button;

  constructor() {
    this.element = createElement('div', 'popup');
    this.backdrop = createElement('div', 'popup__backdrop');

    const card = createElement('div', 'popup__card');
    const title = createElement('h2', 'popup__title');
    title.textContent = GAME_CONFIG.copy.ctaTitle;

    const body = createElement('p', 'popup__body');
    body.textContent = GAME_CONFIG.copy.ctaBody;

    this.playButton = new Button({
      label: GAME_CONFIG.copy.playNow,
      variant: 'primary',
      className: 'popup__btn-primary',
    });

    this.replayButton = new Button({
      label: GAME_CONFIG.copy.spinAgain,
      variant: 'secondary',
      className: 'popup__btn-secondary',
    });

    card.append(title, body, this.playButton.element, this.replayButton.element);
    this.element.append(this.backdrop, card);
  }

  show(): void {
    this.element.classList.add('is-visible');
  }

  hide(): void {
    this.element.classList.remove('is-visible');
  }

  onPlayNow(handler: () => void): () => void {
    return this.playButton.onClick(handler);
  }

  onSpinAgain(handler: () => void): () => void {
    return this.replayButton.onClick(handler);
  }

  destroy(): void {
    this.playButton.destroy();
    this.replayButton.destroy();
  }
}
