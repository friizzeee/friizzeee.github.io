/**
 * Portfolio :
 *  - prévisualisation vidéo au survol (ou à l'écran sur mobile) ;
 *  - galerie filtrée par catégorie, avec l'adresse à jour (/portfolio?categorie=gaming) ;
 *  - méthode de montage : la timeline change d'étape au fil du défilement ;
 *  - « Mon travail » : une tête de lecture traverse les pistes et allume chaque travail ;
 *  - comparateur avant / après et bouton de lecture qui suit la souris.
 * Le lecteur plein écran est dans ./player.ts (ouvert par les boutons data-play et data-play-for).
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $, $$, hasFinePointer, listen, prefersReducedMotion, type Cleanup } from '../lib/dom';
import { motion } from '../lib/motion';
import { arrange } from '../../lib/portfolio/layout';
import { setupPlayer } from './player';

const MAX_PLAYING = 2;
/** Paramètre d'adresse du filtre : /portfolio?categorie=gaming */
const FILTER_PARAM = 'categorie';

/** Le visiteur a demandé à son navigateur d'économiser ses données. */
const savesData = (): boolean =>
  (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;

/* ── Prévisualisations ─────────────────────────── */
function setupPreviews(cleanups: Cleanup[]): void {
  // Ni animation réduite, ni économie de données : les boucles ne sont alors jamais téléchargées.
  if (prefersReducedMotion() || savesData()) return;
  const cards = $$('[data-preview-card]');
  if (!cards.length) return;

  const playing = new Set<HTMLVideoElement>();

  const stop = (video: HTMLVideoElement): void => {
    video.pause();
    playing.delete(video);
    video.closest('[data-preview-card]')?.classList.remove('is-previewing');
  };

  const play = (video: HTMLVideoElement): void => {
    if (!video.getAttribute('src') && video.dataset.src) video.src = video.dataset.src;
    video.play().catch(() => {
      /* lecture automatique refusée : la miniature reste affichée */
    });
    playing.add(video);
    if (playing.size > MAX_PLAYING) {
      const oldest = playing.values().next().value;
      if (oldest && oldest !== video) stop(oldest);
    }
  };

  /* Barre de progression de l'aperçu, mise à jour à chaque image tant qu'une vidéo joue. */
  const progress = (): void => {
    playing.forEach((video) => {
      const bar = video.closest('[data-preview-card]')?.querySelector<HTMLElement>('[data-preview-progress]');
      if (bar && video.duration) bar.style.setProperty('--vp', (video.currentTime / video.duration).toFixed(4));
    });
  };
  gsap.ticker.add(progress);
  cleanups.push(() => gsap.ticker.remove(progress));

  cards.forEach((card) => {
    const video = $<HTMLVideoElement>('video[data-src]', card);
    if (!video) return;
    cleanups.push(
      listen(video, 'playing', () => card.classList.add('is-previewing')),
      () => stop(video),
    );
    if (hasFinePointer()) {
      cleanups.push(
        listen(card, 'pointerenter', () => play(video)),
        listen(card, 'pointerleave', () => stop(video)),
      );
    }
  });

  if (!hasFinePointer()) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = $<HTMLVideoElement>('video[data-src]', entry.target);
          if (!video) return;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) play(video);
          else stop(video);
        });
      },
      { threshold: [0, 0.6] },
    );
    cards.forEach((card) => io.observe(card));
    cleanups.push(() => io.disconnect());
  }
}

/* ── Galerie et filtres ────────────────────────── */
function setupGallery(cleanups: Cleanup[]): void {
  const root = $('[data-gallery]');
  const bar = root ? $('[data-filters]', root) : null;
  const list = root ? $('[data-works]', root) : null;
  if (!root || !bar || !list) return;

  const items = $$('[data-project-item]', list);
  const buttons = $$<HTMLButtonElement>('[data-filter]', bar);
  const status = $('[data-filter-status]', root);
  const empty = $('[data-works-empty]', root);
  const pill = $('[data-filter-pill]', bar);
  const reduce = prefersReducedMotion();
  let current = 'all';
  let running: gsap.core.Animation[] = [];

  const matches = (item: HTMLElement, filter: string): boolean =>
    filter === 'all' || (item.dataset.cats ?? '').split(' ').includes(filter);

  /** Affiche les projets de la catégorie et recompose la grille avec la même règle qu'au build. */
  const layout = (filter: string): HTMLElement[] => {
    const visible = items.filter((item) => matches(item, filter));
    items.forEach((item) => {
      item.hidden = !visible.includes(item);
    });
    arrange(visible.map((item) => ({ vertical: item.hasAttribute('data-vertical') }))).forEach((place, n) => {
      const item = visible[n];
      if (!item) return;
      item.dataset.slot = place.slot;
      item.toggleAttribute('data-offset', place.offset);
    });
    if (empty) empty.hidden = visible.length > 0;
    return visible;
  };

  /* Pastille qui glisse sous le filtre actif */
  const movePill = (instant: boolean): void => {
    const btn = buttons.find((b) => b.dataset.filter === current);
    if (!pill || !btn) return;
    gsap.to(pill, {
      x: btn.offsetLeft,
      y: btn.offsetTop,
      width: btn.offsetWidth,
      height: btn.offsetHeight,
      autoAlpha: 1,
      duration: instant || reduce ? 0 : motion.duration.base,
      ease: motion.ease.out,
      overwrite: 'auto',
    });
  };

  const labelOf = (filter: string): string =>
    buttons.find((b) => b.dataset.filter === filter)?.querySelector('[data-filter-label]')?.textContent?.trim() ?? '';

  const announce = (count: number, filter: string): void => {
    if (!status) return;
    const s = count > 1 ? 's' : '';
    status.textContent = `${count} projet${s} affiché${s}${filter === 'all' ? '' : `, ${labelOf(filter)}`}`;
  };

  const syncUrl = (filter: string): void => {
    const url = new URL(window.location.href);
    if (filter === 'all') url.searchParams.delete(FILTER_PARAM);
    else url.searchParams.set(FILTER_PARAM, filter);
    history.replaceState(history.state, '', url);
  };

  /** Interrompt une transition en cours : le nouveau choix part de l'état actuel. */
  const stopRunning = (): void => {
    running.forEach((animation) => animation.kill());
    running = [];
    gsap.set(items, { clearProps: 'opacity,visibility,transform,clipPath' });
    gsap.set(list, { clearProps: 'height' });
  };

  const select = (wanted: string, animate: boolean, updateUrl: boolean): void => {
    const filter = buttons.some((b) => b.dataset.filter === wanted) ? wanted : 'all';
    if (filter === current) return;
    current = filter;
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === filter)));
    movePill(!animate);
    if (updateUrl) syncUrl(filter);
    stopRunning();

    if (!animate || reduce) {
      announce(layout(filter).length, filter);
      ScrollTrigger.refresh();
      return;
    }

    // Une coupe entre deux catégories : les cartes sortent, la grille se recompose,
    // les nouvelles arrivent de gauche à droite comme des clips posés sur la piste.
    const leaving = items.filter((item) => !item.hidden);
    const startHeight = list.offsetHeight;
    running.push(
      gsap.to(leaving, {
        autoAlpha: 0,
        y: motion.distance.sm,
        duration: motion.duration.quick,
        ease: motion.ease.in,
        stagger: motion.stagger.tight,
        onComplete: () => {
          const visible = layout(filter);
          announce(visible.length, filter);
          const endHeight = list.offsetHeight;
          running.push(
            gsap.fromTo(
              list,
              { height: startHeight },
              { height: endHeight, duration: motion.duration.base, ease: motion.ease.out, clearProps: 'height' },
            ),
            gsap.fromTo(
              visible,
              { autoAlpha: 0, y: motion.distance.md, clipPath: 'inset(0% 100% 0% 0%)' },
              {
                autoAlpha: 1,
                y: 0,
                clipPath: 'inset(0% 0% 0% 0%)',
                duration: motion.duration.slow,
                ease: motion.ease.out,
                stagger: motion.stagger.base,
                clearProps: 'opacity,visibility,transform,clipPath',
                onComplete: () => ScrollTrigger.refresh(),
              },
            ),
          );
        },
      }),
    );
  };

  if (pill) bar.classList.add('has-pill');
  movePill(true);
  document.fonts?.ready.then(() => movePill(true));

  cleanups.push(
    listen(bar, 'click', (e) => {
      const btn = (e.target as Element | null)?.closest<HTMLElement>('[data-filter]');
      if (btn) select(btn.dataset.filter ?? 'all', true, true);
    }),
    listen(root, 'click', (e) => {
      if ((e.target as Element | null)?.closest('[data-filter-reset]')) select('all', true, true);
    }),
    listen(window, 'resize', () => movePill(true)),
    stopRunning,
  );

  // Arrivée depuis un lien filtré (accueil, services, page projet).
  const initial = new URL(window.location.href).searchParams.get(FILTER_PARAM);
  if (initial) select(initial, false, false);
}

/* ── Méthode : la timeline suit l'étape à l'écran ── */
function setupMethod(): void {
  const root = $('[data-method]');
  const board = root ? $('[data-method-board]', root) : null;
  if (!root || !board) return;
  const steps = $$('[data-method-step]', root);

  const set = (index: number): void => {
    board.dataset.stage = String(index + 1);
    steps.forEach((step, n) => step.classList.toggle('is-active', n === index));
  };

  steps.forEach((step, index) => {
    ScrollTrigger.create({
      trigger: step,
      start: 'top 62%',
      end: 'bottom 62%',
      onToggle: (self) => {
        if (self.isActive) set(index);
      },
    });
  });
}

/* ── Mon travail : une tête de lecture traverse les pistes ── */
function setupWorkTimeline(): void {
  const root = $('[data-work-timeline]');
  if (!root) return;
  const clips = $$('[data-wt-clip]', root);
  const light = (clip: HTMLElement, on: boolean): void => {
    clip.classList.toggle('is-lit', on);
  };

  if (prefersReducedMotion()) {
    clips.forEach((clip) => light(clip, true));
    return;
  }

  // Petit écran : les pistes sont empilées, chaque travail s'allume à son arrivée.
  if (!window.matchMedia('(min-width: 48rem)').matches) {
    clips.forEach((clip) =>
      ScrollTrigger.create({ trigger: clip, start: 'top 85%', once: true, onEnter: () => light(clip, true) }),
    );
    return;
  }

  /* Position de départ de chaque travail sur sa piste (0 à gauche, 1 à droite). */
  let starts: number[] = [];
  const measure = (): void => {
    starts = clips.map((clip) => {
      const lane = clip.parentElement?.getBoundingClientRect();
      if (!lane || !lane.width) return 0;
      return (clip.getBoundingClientRect().left - lane.left + 24) / lane.width;
    });
  };
  const apply = (progress: number): void => {
    root.style.setProperty('--wt-p', progress.toFixed(4));
    clips.forEach((clip, i) => light(clip, progress >= (starts[i] ?? 0)));
  };

  root.classList.add('is-scrubbing');
  measure();
  ScrollTrigger.create({
    trigger: root,
    start: 'top 72%',
    end: 'bottom 55%',
    onRefresh: (self) => {
      measure();
      apply(self.progress);
    },
    onUpdate: (self) => apply(self.progress),
  });
}

/* ── Avant / Après ─────────────────────────────── */
function setupBeforeAfter(cleanups: Cleanup[]): void {
  $$('[data-ba]').forEach((root) => {
    const input = $<HTMLInputElement>('input[type="range"]', root);
    if (!input) return;
    const set = (): void => root.style.setProperty('--pos', `${input.value}%`);
    set();
    cleanups.push(listen(input, 'input', set));
  });
}

/* ── Bouton de lecture qui suit la souris au-dessus d'une vidéo ── */
function setupFollow(cleanups: Cleanup[]): void {
  if (prefersReducedMotion() || !hasFinePointer()) return;
  $$('[data-follow-area]').forEach((area) => {
    const el = $('[data-follow]', area);
    if (!el) return;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.9, ease: 'expo.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.9, ease: 'expo.out' });
    cleanups.push(
      listen<PointerEvent>(area, 'pointermove', (e) => {
        // Centre « au repos » du bouton = position actuelle moins le décalage déjà appliqué
        const b = el.getBoundingClientRect();
        const homeX = b.left + b.width / 2 - Number(gsap.getProperty(el, 'x'));
        const homeY = b.top + b.height / 2 - Number(gsap.getProperty(el, 'y'));
        xTo(e.clientX - homeX);
        yTo(e.clientY - homeY);
      }),
      listen(area, 'pointerleave', () => {
        xTo(0);
        yTo(0);
      }),
      () => gsap.set(el, { clearProps: 'x,y' }),
    );
  });
}

export function initPortfolio(): Cleanup {
  const cleanups: Cleanup[] = [];
  // Les déclencheurs de défilement créés ici sont retirés d'un bloc au changement de page.
  const ctx = gsap.context(() => {});
  setupPreviews(cleanups);
  setupFollow(cleanups);
  setupPlayer(cleanups);
  setupBeforeAfter(cleanups);
  ctx.add(() => {
    setupGallery(cleanups);
    setupMethod();
    setupWorkTimeline();
  });
  cleanups.push(() => ctx.revert());
  return () => cleanups.forEach((fn) => fn());
}
