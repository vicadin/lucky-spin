export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  attrs?: Record<string, string>
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, value);
    }
  }
  return el;
}

export function qs<T extends Element = Element>(selector: string, parent: ParentNode = document): T {
  return parent.querySelector(selector) as T;
}

export function qsa<T extends Element = Element>(selector: string, parent: ParentNode = document): T[] {
  return Array.from(parent.querySelectorAll(selector)) as T[];
}

export function setStyles(el: HTMLElement, styles: Partial<CSSStyleDeclaration>): void {
  Object.assign(el.style, styles);
}

export function addClass(el: Element, ...classes: string[]): void {
  el.classList.add(...classes);
}

export function removeClass(el: Element, ...classes: string[]): void {
  el.classList.remove(...classes);
}

export function toggleClass(el: Element, className: string, force?: boolean): void {
  el.classList.toggle(className, force);
}

export type Unsubscribe = () => void;

export function listen(
  target: EventTarget,
  event: string,
  handler: EventListener,
  options?: AddEventListenerOptions
): Unsubscribe {
  target.addEventListener(event, handler, options);
  return () => target.removeEventListener(event, handler, options);
}

export function setText(el: Element, text: string): void {
  el.textContent = text;
}

export function empty(el: Element): void {
  while (el.firstChild) el.removeChild(el.firstChild);
}
