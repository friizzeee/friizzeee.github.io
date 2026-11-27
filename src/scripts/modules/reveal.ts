/**
 * Apparition au défilement, une seule fois : <… data-reveal> (data-reveal-delay="0.1" pour décaler).
 * Réservée aux titres et aux blocs qui arrivent : tout le reste est déjà là.
 * Animations réduites : tout est visible tout de suite.
 */
import { $$, prefersReducedMotion, type Cleanup } from '../lib/dom';

export function initReveal(): Cleanup {
  document.documentElement.classList.add('reveal-ready');
  const items = $$('[data-reveal]');
  if (items.length === 0) return () => {};
  if (prefersReducedMotion()) {
    items.forEach((el) => el.classList.add('is-in'));
    return () => {};
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        if (el.dataset.revealDelay) el.style.setProperty('--reveal-delay', `${el.dataset.revealDelay}s`);
        el.classList.add('is-in');
        io.unobserve(el);
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );
  items.forEach((el) => io.observe(el));
  return () => io.disconnect();
}
