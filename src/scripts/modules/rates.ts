/**
 * Tarifs (components/home/Rates.astro) :
 *  - les promos dont la date est passée disparaissent, même si le site n'a pas été reconstruit ;
 *  - le compte à rebours des offres de lancement, en jours (jamais d'heure inventée) ;
 *  - le tampon de la promo frappe le papier quand il arrive à l'écran (une fois).
 * Les deux premiers points fonctionnent aussi quand les animations sont réduites.
 */
import { $, $$, prefersReducedMotion, type Cleanup } from '../lib/dom';
import { daysUntil, promoEnd } from '../../lib/promo-date';

function expirePromos(): void {
  $$('[data-promo-until]').forEach((el) => {
    if (Date.now() <= promoEnd(el.dataset.promoUntil ?? '').getTime()) return;
    if (!el.matches('[data-offer]')) {
      el.remove();
      return;
    }
    // Offre : retour au prix normal, sans tampon ni code ; le bouton redevient simple.
    el.classList.remove('offer--promo');
    el.querySelector('.pill--solid')?.classList.remove('pill--solid');
    el.querySelectorAll('[data-promo]').forEach((node) => node.remove());
    el.querySelectorAll<HTMLElement>('[data-promo-off]').forEach((node) => (node.hidden = false));
  });
}

function updateCountdowns(): void {
  $$('[data-countdown]').forEach((el) => {
    const days = daysUntil(el.dataset.countdown ?? '');
    if (!Number.isFinite(days) || days < 0) return;
    const prefix = $('[data-countdown-prefix]', el);
    const value = $('[data-countdown-days]', el);
    const spoken = $('[data-countdown-spoken]', el);
    if (prefix) prefix.textContent = days === 0 ? '' : 'J−';
    if (value) value.textContent = days === 0 ? 'Jour J' : String(days);
    if (spoken) {
      spoken.textContent =
        days === 0 ? 'Dernier jour aujourd’hui' : `Plus que ${days} jour${days > 1 ? 's' : ''} avant la fin des offres`;
    }
    el.hidden = false;
  });
}

export function initRates(): Cleanup {
  expirePromos();
  updateCountdowns();

  const stamps = $$('[data-stamp]');
  if (stamps.length === 0) return () => {};
  if (prefersReducedMotion()) {
    stamps.forEach((s) => s.classList.add('is-in'));
    return () => {};
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -25% 0px' },
  );
  stamps.forEach((s) => io.observe(s));
  return () => io.disconnect();
}
