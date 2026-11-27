/**
 * Vidéos d'illustration et page Réalisations :
 *  - [data-inview-loop] : boucle muette chargée et lue seulement quand elle est à l'écran (jamais en
 *    « animations réduites », où l'affiche reste) ;
 *  - [data-preview] : aperçu au survol d'une réalisation (souris uniquement) ;
 *  - [data-filter] : filtres par catégorie (adresse partageable : /portfolio?categorie=gaming).
 */
import { $, $$, hasFinePointer, listen, prefersReducedMotion, type Cleanup } from '../lib/dom';

function load(video: HTMLVideoElement): void {
  if (!video.src && video.dataset.src) {
    video.src = video.dataset.src;
    video.preload = 'auto';
  }
}

function inViewLoops(): Cleanup {
  const videos = $$<HTMLVideoElement>('video[data-inview-loop]');
  if (videos.length === 0 || prefersReducedMotion()) return () => {};
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const v = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) {
          load(v);
          v.play().catch(() => undefined);
        } else if (!v.paused) v.pause();
      }
    },
    { rootMargin: '10% 0px' },
  );
  videos.forEach((v) => io.observe(v));
  return () => io.disconnect();
}

function hoverPreviews(): Cleanup {
  if (!hasFinePointer() || prefersReducedMotion()) return () => {};
  const cleanups: Cleanup[] = [];
  $$('[data-preview]').forEach((card) => {
    const video = $<HTMLVideoElement>('video', card);
    if (!video) return;
    cleanups.push(
      listen(card, 'pointerenter', () => {
        load(video);
        video.play().then(() => card.classList.add('is-previewing')).catch(() => undefined);
      }),
      listen(card, 'pointerleave', () => {
        video.pause();
        card.classList.remove('is-previewing');
      }),
    );
  });
  return () => cleanups.forEach((fn) => fn());
}

function filters(): Cleanup {
  const bar = $('[data-filters]');
  if (!bar) return () => {};
  const buttons = $$<HTMLButtonElement>('[data-filter]', bar);
  const rows = $$('[data-project]');
  const status = $('[data-filter-status]');

  const apply = (id: string, push: boolean): void => {
    const known = buttons.some((b) => b.dataset.filter === id) ? id : 'tout';
    let shown = 0;
    rows.forEach((row) => {
      const match = known === 'tout' || (row.dataset.cats ?? '').split(' ').includes(known);
      row.hidden = !match;
      if (match) shown++;
    });
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === known)));
    if (status) status.textContent = `${shown} réalisation${shown > 1 ? 's' : ''}`;
    if (push) {
      const url = new URL(location.href);
      if (known === 'tout') url.searchParams.delete('categorie');
      else url.searchParams.set('categorie', known);
      history.replaceState(null, '', url);
    }
  };

  apply(new URL(location.href).searchParams.get('categorie') ?? 'tout', false);
  return listen(bar, 'click', (e) => {
    const button = (e.target as Element).closest<HTMLButtonElement>('[data-filter]');
    if (button) apply(button.dataset.filter ?? 'tout', true);
  });
}

export function initWorks(): Cleanup {
  const cleanups = [inViewLoops(), hoverPreviews(), filters()];
  return () => cleanups.forEach((fn) => fn());
}
