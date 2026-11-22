/**
 * Section des offres (Packages.astro + PromoSlate.astro) :
 *  - les promos dont la date est passée disparaissent, même si le site n'a pas été reconstruit ;
 *  - le compte à rebours de la claquette (en jours, jamais d'heure inventée) ;
 *  - animations : la claquette « clape » quand elle arrive à l'écran, puis le prix normal se barre
 *    et le prix avec code défile jusqu'à sa valeur.
 * Les deux premiers points fonctionnent aussi quand les animations sont réduites.
 */
import { gsap } from 'gsap';
import { $, $$, listen, type Cleanup } from '../lib/dom';
import { daysUntil, promoEnd } from '../../lib/promo-date';

function expirePromos(): void {
  $$('[data-promo-until]').forEach((el) => {
    if (Date.now() <= promoEnd(el.dataset.promoUntil ?? '').getTime()) return;
    if (!el.matches('.pkg')) return el.remove();
    // Carte : retour au prix normal, sans halo ni code.
    el.classList.remove('pkg--promo', 'pkg--featured');
    el.querySelector('.btn--primary')?.classList.remove('btn--primary');
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
    el.parentElement?.querySelector<HTMLElement>('[data-countdown-fallback]')?.setAttribute('hidden', '');
  });
}

const money = (v: number, decimals: number): string =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(v);

/** La claquette se referme d'un coup sec, puis le compte à rebours et les tickets arrivent. */
function animateSlate(): void {
  const slate = $('[data-slate]');
  const stick = slate && $('[data-clap-stick]', slate);
  const board = slate && $('[data-clap-board]', slate);
  if (!slate || !stick || !board) return;

  const days = $('[data-countdown-days]', slate);
  const target = Number(days?.textContent);
  const tickets = $$('[data-ticket]', slate);

  gsap.set(stick, { rotation: -17 });
  gsap.set(tickets, { autoAlpha: 0, x: 28 });

  const tl = gsap.timeline({ scrollTrigger: { trigger: slate, start: 'top 72%', once: true } });
  tl.to(stick, { rotation: 0, duration: 0.3, ease: 'power4.in', delay: 0.15 })
    .to(board, { y: 3, duration: 0.05, yoyo: true, repeat: 1, ease: 'power1.out' })
    .to(stick, { y: -2, duration: 0.05, yoyo: true, repeat: 1, ease: 'power1.out' }, '<')
    .to(tickets, { autoAlpha: 1, x: 0, duration: 1, ease: 'expo.out', stagger: 0.1 }, '<0.05');

  // Le compte à rebours « descend » jusqu'au bon nombre de jours.
  if (days && Number.isInteger(target) && target > 0) {
    const state = { v: target + 24 };
    tl.to(
      state,
      {
        v: target,
        duration: 1.2,
        ease: 'expo.out',
        onUpdate: () => (days.textContent = String(Math.round(state.v))),
        onComplete: () => (days.textContent = String(target)),
      },
      '<',
    );
  }
}

/** Cartes en promo : le prix normal se barre, le prix avec code défile depuis le prix normal. */
function animatePromoPrices(cleanups: Cleanup[]): void {
  $$('[data-price-from]').forEach((el) => {
    const value = $('[data-price-value]', el);
    const strike = el.closest('.pkg')?.querySelector<HTMLElement>('[data-price-strike]');
    const from = Number(el.dataset.priceFrom);
    const to = Number(el.dataset.priceTo);
    if (!value || !Number.isFinite(from) || !Number.isFinite(to)) return;

    const final = value.textContent ?? '';
    const decimals = Number.isInteger(from) && Number.isInteger(to) ? 0 : 2;
    const state = { v: from };
    value.textContent = money(from, decimals); // avant le passage : le prix normal, pas encore barré
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', once: true }, delay: 0.45 });
    if (strike) tl.fromTo(strike, { scaleX: 0 }, { scaleX: 1, duration: 0.55, ease: 'power3.inOut' });
    tl.fromTo(
      state,
      { v: from },
      {
        v: to,
        duration: 1.1,
        ease: 'expo.out',
        onStart: () => (value.textContent = money(from, decimals)),
        onUpdate: () => (value.textContent = money(state.v, decimals)),
        onComplete: () => (value.textContent = final),
      },
      '-=0.15',
    );
    cleanups.push(() => (value.textContent = final));
  });
}

/** Arrivée sur une carte par un lien « Voir l'offre » (chrome.ts lui donne le focus) : bref contour rouge. */
function flashOnArrival(): Cleanup {
  return listen(document, 'focusin', (e) => {
    const card = e.target as HTMLElement;
    if (!card.matches?.('.pkg')) return;
    card.classList.remove('is-flash');
    void card.offsetWidth; // relance l'animation si on revient sur la même carte
    card.classList.add('is-flash');
    // Sinon, un clic plus tard dans la carte lui redonnerait le focus (et le contour).
    card.addEventListener('blur', () => card.removeAttribute('tabindex'), { once: true });
  });
}

export function initOffers(): Cleanup {
  expirePromos();
  updateCountdowns();
  const offFlash = flashOnArrival();

  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const cleanups: Cleanup[] = [];
    animateSlate();
    animatePromoPrices(cleanups);
    return () => cleanups.forEach((fn) => fn());
  });
  return () => {
    offFlash();
    mm.revert();
  };
}
