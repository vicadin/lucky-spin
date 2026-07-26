import type { AssetLoader } from '@/core/AssetLoader';
import { WHEEL_SEGMENTS, SEGMENT_ANGLE } from '@/config/wheelConfig';
import { createElement } from '@/utils/dom';
import { rotationForSegment } from '@/utils/math';
import { wheelSpinEase, anticipationEase } from '@/utils/easing';

export interface SpinOptions {
  durationMs: number;
  minRotations: number;
  useAnticipation: boolean;
  anticipationPauseMs: number;
  jackpotIndex: number;
}

export class Wheel {
  readonly element: HTMLElement;
  private readonly disc: HTMLElement;
  private readonly svg: SVGSVGElement;
  private currentRotation = 0;
  private idleRafId: number | null = null;
  private spinAbort: (() => void) | null = null;

  constructor(assets: AssetLoader) {
    this.element = createElement('div', 'wheel');

    const pointer = createElement('div', 'wheel__pointer');
    this.element.appendChild(pointer);

    this.disc = createElement('div', 'wheel__disc');
    this.svg = this.buildWheelSvg();
    this.disc.appendChild(this.svg);

    const center = createElement('div', 'wheel__center');
    this.disc.appendChild(center);

    this.element.appendChild(this.disc);

    const wheelImg = assets.getImageUrl('wheel');
    if (wheelImg) {
      this.disc.style.backgroundImage = `url(${wheelImg})`;
      this.svg.style.opacity = '0';
    }

    const centerImg = assets.getImageUrl('wheel-center');
    if (centerImg) {
      center.style.backgroundImage = `url(${centerImg})`;
    }

    const pointerImg = assets.getImageUrl('pointer');
    if (pointerImg) {
      pointer.style.backgroundImage = `url(${pointerImg})`;
      pointer.style.backgroundSize = 'contain';
      pointer.style.backgroundRepeat = 'no-repeat';
      pointer.style.backgroundPosition = 'center top';
    }
  }

  stopIdle(): void {
    if (this.idleRafId !== null) {
      cancelAnimationFrame(this.idleRafId);
      this.idleRafId = null;
    }
  }

  spinToSegment(segmentIndex: number, options: SpinOptions): Promise<void> {
    this.stopIdle();
    this.spinAbort?.();

    return new Promise((resolve) => {
      const {
        durationMs,
        minRotations,
        useAnticipation,
        anticipationPauseMs,
        jackpotIndex,
      } = options;

      const startRotation = this.currentRotation;
      let finalRotation = rotationForSegment(segmentIndex, startRotation, minRotations);

      if (useAnticipation && jackpotIndex >= 0) {
        const jackpotRotation = rotationForSegment(jackpotIndex, startRotation, minRotations - 1);
        finalRotation = rotationForSegment(segmentIndex, jackpotRotation, 1);
        this.runAnticipationSpin(
          startRotation,
          jackpotRotation,
          finalRotation,
          durationMs,
          anticipationPauseMs,
          resolve
        );
        return;
      }

      this.runSpin(startRotation, finalRotation, durationMs, wheelSpinEase, resolve);
    });
  }

  destroy(): void {
    this.stopIdle();
    this.spinAbort?.();
  }

  private runAnticipationSpin(
    start: number,
    nearJackpot: number,
    final: number,
    totalDuration: number,
    pauseMs: number,
    resolve: () => void
  ): void {
    const phase1Duration = totalDuration * 0.78;
    const phase2Duration = totalDuration * 0.22;

    this.runSpin(start, nearJackpot, phase1Duration, wheelSpinEase, () => {
      setTimeout(() => {
        this.runSpin(nearJackpot, final, phase2Duration, anticipationEase, resolve);
      }, pauseMs);
    });
  }

  private runSpin(
    from: number,
    to: number,
    durationMs: number,
    ease: (t: number) => number,
    onComplete: () => void
  ): void {
    const startTime = performance.now();
    let rafId: number;

    const tick = (now: number): void => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / durationMs, 1);
      const eased = ease(t);
      this.currentRotation = from + (to - from) * eased;
      this.applyRotation(this.currentRotation);

      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        this.currentRotation = to;
        this.applyRotation(to);
        this.spinAbort = null;
        onComplete();
      }
    };

    this.spinAbort = () => {
      cancelAnimationFrame(rafId);
      this.spinAbort = null;
    };

    rafId = requestAnimationFrame(tick);
  }

  private applyRotation(deg: number): void {
    this.disc.style.transform = `rotate(${deg}deg)`;
  }

  private buildWheelSvg(): SVGSVGElement {
    const size = 320;
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 4;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.setAttribute('class', 'wheel__svg');

    WHEEL_SEGMENTS.forEach((segment, i) => {
      const startAngle = i * SEGMENT_ANGLE - 90;
      const endAngle = startAngle + SEGMENT_ANGLE;
      const path = this.describeArc(cx, cy, r, startAngle, endAngle);

      const slice = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      slice.setAttribute('d', path);
      slice.setAttribute('fill', segment.color);
      slice.setAttribute('stroke', 'rgba(255,255,255,0.15)');
      slice.setAttribute('stroke-width', '1');
      svg.appendChild(slice);

      const midAngle = startAngle + SEGMENT_ANGLE / 2;
      const labelR = r * 0.65;
      const lx = cx + labelR * Math.cos((midAngle * Math.PI) / 180);
      const ly = cy + labelR * Math.sin((midAngle * Math.PI) / 180);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', String(lx));
      text.setAttribute('y', String(ly));
      text.setAttribute('fill', segment.textColor);
      text.setAttribute('font-size', segment.multiplier >= 100 ? '14' : '16');
      text.setAttribute('font-weight', '800');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('transform', `rotate(${midAngle + 90}, ${lx}, ${ly})`);
      text.textContent = segment.label;
      svg.appendChild(text);
    });

    const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    ring.setAttribute('cx', String(cx));
    ring.setAttribute('cy', String(cy));
    ring.setAttribute('r', String(r));
    ring.setAttribute('fill', 'none');
    ring.setAttribute('stroke', 'rgba(255,215,0,0.6)');
    ring.setAttribute('stroke-width', '6');
    svg.appendChild(ring);

    return svg;
  }

  private describeArc(
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    endAngle: number
  ): string {
    const start = this.polar(cx, cy, r, endAngle);
    const end = this.polar(cx, cy, r, startAngle);
    const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
  }

  private polar(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }
}
