import { createElement } from '@/utils/dom';
import { easeOutCubic } from '@/utils/easing';
import { randomFloat, randomInt } from '@/utils/random';

interface Particle {
  el: HTMLElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vr: number;
  life: number;
  maxLife: number;
  type: 'confetti' | 'coin' | 'ambient';
}

const POOL_SIZE = 64;

export class Particles {
  readonly element: HTMLElement;
  private readonly pool: Particle[] = [];
  private active: Particle[] = [];
  private rafId: number | null = null;
  private ambientActive = false;
  private coinImageUrl: string | null = null;

  constructor(_parent: HTMLElement) {
    this.element = createElement('div', 'particles');
    this.initPool();
  }

  setCoinImage(url: string): void {
    this.coinImageUrl = url;
  }

  startAmbient(): void {
    this.ambientActive = true;
    if (this.rafId === null) this.startLoop();
  }

  stopAmbient(): void {
    this.ambientActive = false;
  }

  burstConfetti(count: number): void {
    for (let i = 0; i < count; i++) {
      const p = this.acquire('confetti');
      if (!p) break;
      p.x = randomFloat(0.2, 0.8) * window.innerWidth;
      p.y = randomFloat(0.1, 0.3) * window.innerHeight;
      p.vx = randomFloat(-3, 3);
      p.vy = randomFloat(2, 6);
      p.rotation = randomFloat(0, 360);
      p.vr = randomFloat(-8, 8);
      p.life = 0;
      p.maxLife = randomInt(60, 120);
      p.el.className = `particles__item particles__item--confetti particles__item--c${i % 6}`;
      p.el.style.opacity = '1';
      this.active.push(p);
    }
    if (this.rafId === null) this.startLoop();
  }

  burstCoins(count: number): void {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.45;

    for (let i = 0; i < count; i++) {
      const p = this.acquire('coin');
      if (!p) break;
      const angle = (i / count) * Math.PI * 2;
      p.x = cx;
      p.y = cy;
      p.vx = Math.cos(angle) * randomFloat(4, 10);
      p.vy = Math.sin(angle) * randomFloat(4, 10) - 4;
      p.rotation = randomFloat(0, 360);
      p.vr = randomFloat(-12, 12);
      p.life = 0;
      p.maxLife = randomInt(40, 80);
      p.el.className = 'particles__item particles__item--coin';
      if (this.coinImageUrl) {
        p.el.style.backgroundImage = `url(${this.coinImageUrl})`;
      }
      p.el.style.opacity = '1';
      this.active.push(p);
    }
    if (this.rafId === null) this.startLoop();
  }

  destroy(): void {
    this.stopAmbient();
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.active.length = 0;
    for (const p of this.pool) {
      p.el.remove();
    }
    this.pool.length = 0;
  }

  private initPool(): void {
    for (let i = 0; i < POOL_SIZE; i++) {
      const el = createElement('div', 'particles__item');
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
      this.element.appendChild(el);
      this.pool.push({
        el,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        rotation: 0,
        vr: 0,
        life: 0,
        maxLife: 0,
        type: 'confetti',
      });
    }
  }

  private acquire(type: Particle['type']): Particle | null {
    const idle = this.pool.find((p) => !this.active.includes(p));
    if (!idle) return null;
    idle.type = type;
    return idle;
  }

  private startLoop(): void {
    let ambientTimer = 0;

    const tick = (): void => {
      ambientTimer++;
      if (this.ambientActive && ambientTimer % 45 === 0) {
        this.spawnAmbient();
      }

      const gravity = 0.15;

      for (let i = this.active.length - 1; i >= 0; i--) {
        const p = this.active[i];
        p.life++;
        p.vy += gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vr;

        const progress = p.life / p.maxLife;
        const opacity = 1 - easeOutCubic(progress);

        p.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) rotate(${p.rotation}deg)`;
        p.el.style.opacity = String(Math.max(0, opacity));

        if (p.life >= p.maxLife) {
          p.el.style.opacity = '0';
          this.active.splice(i, 1);
        }
      }

      if (this.active.length > 0 || this.ambientActive) {
        this.rafId = requestAnimationFrame(tick);
      } else {
        this.rafId = null;
      }
    };

    this.rafId = requestAnimationFrame(tick);
  }

  private spawnAmbient(): void {
    const p = this.acquire('ambient');
    if (!p) return;
    p.x = randomFloat(0, window.innerWidth);
    p.y = window.innerHeight + 20;
    p.vx = randomFloat(-0.3, 0.3);
    p.vy = randomFloat(-1.2, -0.4);
    p.rotation = randomFloat(0, 360);
    p.vr = randomFloat(-1, 1);
    p.life = 0;
    p.maxLife = randomInt(120, 200);
    p.el.className = 'particles__item particles__item--ambient';
    p.el.style.opacity = '0.5';
    this.active.push(p);
  }
}
