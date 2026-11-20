/**
 * Défilement fluide (Lenis), synchronisé avec GSAP ScrollTrigger.
 * Désactivé si l'utilisateur préfère réduire les animations :
 * le défilement natif du navigateur est alors utilisé.
 */
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './dom';

let lenis: Lenis | null = null;

export function initSmoothScroll(): void {
  if (lenis || prefersReducedMotion()) return;

  lenis = new Lenis({
    lerp: 0.1,
    smoothWheel: true,
    // Les fenêtres (lecteur vidéo, menu) gardent leur propre défilement.
    prevent: (node) => node.closest('dialog, [data-lenis-prevent]') !== null,
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);

export const smooth = {
  stop(): void {
    lenis?.stop();
  },
  start(): void {
    lenis?.start();
  },
  resize(): void {
    lenis?.resize();
  },
  scrollTo(target: HTMLElement | number, options: { immediate?: boolean } = {}): void {
    if (lenis) {
      lenis.scrollTo(target, { immediate: options.immediate, duration: 1.4, easing: easeOutQuart });
      return;
    }
    const top = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top, behavior: options.immediate || prefersReducedMotion() ? 'auto' : 'smooth' });
  },
};
