/** Petits utilitaires DOM partagés par les modules d'animation. */

export type Cleanup = () => void;

export const $ = <T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T | null =>
  root.querySelector<T>(selector);

export const $$ = <T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T[] =>
  Array.from(root.querySelectorAll<T>(selector));

/** addEventListener qui renvoie directement sa fonction de nettoyage. */
export function listen<E extends Event = Event>(
  target: EventTarget,
  type: string,
  handler: (event: E) => void,
  options?: AddEventListenerOptions | boolean,
): Cleanup {
  const fn = handler as EventListener;
  target.addEventListener(type, fn, options);
  return () => target.removeEventListener(type, fn, options);
}

export const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const hasFinePointer = (): boolean =>
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;

const pad = (n: number): string => String(n).padStart(2, '0');

/** Secondes → timecode HH:MM:SS:FF (25 images/s). */
export function toTimecode(totalSeconds: number, fps = 25): string {
  const s = Math.max(0, totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const f = Math.floor((s % 1) * fps);
  return `${pad(h)}:${pad(m)}:${pad(sec)}:${pad(f)}`;
}

export const clamp = (value: number, min = 0, max = 1): number => Math.min(max, Math.max(min, value));
