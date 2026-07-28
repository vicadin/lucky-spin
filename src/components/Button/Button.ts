import { createElement, listen } from '@/utils/dom';

export interface ButtonOptions {
  label: string;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export class Button {
  readonly element: HTMLButtonElement;
  private readonly labelEl: HTMLElement;
  private enabled = true;
  private pulseActive = false;
  private clickHandlers: Array<() => void> = [];
  private unsubClick: (() => void) | null = null;

  constructor(options: ButtonOptions) {
    const { label, variant = 'primary', className = '' } = options;

    this.element = createElement('button', `btn btn--${variant} ${className}`) as HTMLButtonElement;
    this.element.type = 'button';

    const glow = createElement('span', 'btn__glow');
    this.labelEl = createElement('span', 'btn__label');
    this.labelEl.textContent = label;

    this.element.append(glow, this.labelEl);
    this.unsubClick = listen(this.element, 'click', () => this.handleClick());
  }

  onClick(handler: () => void): () => void {
    this.clickHandlers.push(handler);
    return () => {
      this.clickHandlers = this.clickHandlers.filter((h) => h !== handler);
    };
  }

  setLabel(text: string): void {
    this.labelEl.textContent = text;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.element.classList.toggle('is-disabled', !enabled);
    this.element.toggleAttribute('disabled', !enabled);
  }

  setBackgroundImage(url: string): void {
    this.element.style.backgroundImage = `url(${url})`;
    this.element.classList.add('btn--image');
  }

  startPulse(): void {
    if (this.pulseActive) return;
    this.pulseActive = true;
    this.element.classList.add('is-pulsing');
  }

  stopPulse(): void {
    this.pulseActive = false;
    this.element.classList.remove('is-pulsing');
  }

  destroy(): void {
    this.unsubClick?.();
    this.clickHandlers.length = 0;
  }

  private handleClick(): void {
    if (!this.enabled) return;
    for (const handler of this.clickHandlers) handler();
  }
}
