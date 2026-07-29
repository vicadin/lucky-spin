import { createElement } from '@/utils/dom';
import { easeOutExpo } from '@/utils/easing';

export class Counter {
  readonly element: HTMLElement;
  private readonly prefixEl: HTMLElement;
  private readonly valueEl: HTMLElement;
  private rafId: number | null = null;

  constructor(prefix: string) {
    this.element = createElement('div', 'counter');
    this.prefixEl = createElement('span', 'counter__prefix');
    this.prefixEl.textContent = prefix;
    this.valueEl = createElement('span', 'counter__value');
    this.valueEl.textContent = 'x0!';
    this.element.append(this.prefixEl, this.valueEl);
  }

  animateTo(multiplier: number, durationMs: number): Promise<void> {
    this.cancelAnimation();
    this.valueEl.textContent = 'x0!';

    return new Promise((resolve) => {
      const start = performance.now();

      const tick = (now: number): void => {
        const elapsed = now - start;
        const t = Math.min(elapsed / durationMs, 1);
        const eased = easeOutExpo(t);
        const current = Math.round(multiplier * eased);
        this.valueEl.textContent = `x${current}!`;

        if (t < 1) {
          this.rafId = requestAnimationFrame(tick);
        } else {
          this.valueEl.textContent = `x${multiplier}!`;
          this.rafId = null;
          resolve();
        }
      };

      this.rafId = requestAnimationFrame(tick);
    });
  }

  setValue(multiplier: number): void {
    this.valueEl.textContent = `x${multiplier}!`;
  }

  private cancelAnimation(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
