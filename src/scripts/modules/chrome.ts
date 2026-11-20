/**
 * Interface fixe : en-tête (fond flouté, masqué en descendant), barre de
 * progression mobile, barre de chapitres (timecode), lien actif du menu,
 * ancres en défilement fluide et menu mobile.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $, $$, clamp, listen, prefersReducedMotion, toTimecode, type Cleanup } from '../lib/dom';
import { smooth } from '../lib/smooth';

/** La page d'accueil se lit comme une vidéo de 10 minutes. */
const PAGE_DURATION_SECONDS = 600;

interface Chapter {
  el: HTMLElement;
  id: string;
  label: string;
  start: number;
  end: number;
  fill: HTMLElement | null;
}

const pad = (n: number): string => String(n).padStart(2, '0');

export function initChrome(): Cleanup {
  const html = document.documentElement;
  const cleanups: Cleanup[] = [];

  const progressBar = $('[data-progress-bar]');
  const tcEl = $('[data-scrubber-tc]');
  const labelEl = $('[data-scrubber-label]');
  const track = $('[data-scrubber-track]');
  const footer = $('footer');
  const navLinks = $$<HTMLAnchorElement>('[data-nav-section]');
  const avoidZones = $$('[data-scrubber-avoid]');
  /** Lien de la page en cours (Portfolio, page projet) : il reste allumé quelle que soit la section. */
  const pageLink = navLinks.find((a) => a.dataset.navPage !== undefined) ?? null;

  let chapters: Chapter[] = [];
  let lastY = window.scrollY;
  let current = -1;
  let frame = 0;

  /* ── Pastille du menu : suit le survol, sinon se pose sur la section en cours ── */
  const nav = $('[data-nav]');
  const pill = $('[data-nav-pill]');
  let hovered: HTMLElement | null = null;
  let activeLink: HTMLElement | null = null;
  let pillPlaced = false;

  const movePill = (link: HTMLElement | null): void => {
    if (!nav || !pill) return;
    const instant = !pillPlaced || prefersReducedMotion();
    if (!link) {
      gsap.to(pill, { autoAlpha: 0, duration: instant ? 0 : 0.35, overwrite: 'auto' });
      return;
    }
    const n = nav.getBoundingClientRect();
    const r = link.getBoundingClientRect();
    gsap.to(pill, {
      x: r.left - n.left,
      y: r.top - n.top,
      width: r.width,
      height: r.height,
      autoAlpha: 1,
      duration: instant ? 0 : 0.6,
      ease: 'expo.out',
      overwrite: 'auto',
    });
    pillPlaced = true;
  };

  if (nav && pill) {
    nav.classList.add('has-pill');
    navLinks.forEach((a) =>
      cleanups.push(
        listen(a, 'pointerenter', () => {
          hovered = a;
          movePill(a);
        }),
      ),
    );
    cleanups.push(
      listen(nav, 'pointerleave', () => {
        hovered = null;
        movePill(activeLink);
      }),
    );
  }

  /* ── Mise à jour à chaque défilement (1 fois par image max) ── */
  const update = (): void => {
    frame = 0;
    const y = window.scrollY;
    const max = Math.max(1, html.scrollHeight - window.innerHeight);
    const progress = clamp(y / max);

    html.classList.toggle('is-scrolled', y > 24);
    if (y < 80) {
      html.classList.remove('header-hidden');
    } else if (Math.abs(y - lastY) > 6) {
      html.classList.toggle('header-hidden', y > lastY && y > window.innerHeight * 0.6);
    }
    if (Math.abs(y - lastY) > 6) lastY = y;

    if (progressBar) progressBar.style.transform = `scaleX(${progress})`;
    if (tcEl) tcEl.textContent = toTimecode(progress * PAGE_DURATION_SECONDS);

    let active = 0;
    chapters.forEach((c, i) => {
      const span = c.end - c.start;
      const p = span > 0 ? clamp((y - c.start) / span) : y >= c.start ? 1 : 0;
      c.fill?.style.setProperty('--p', p.toFixed(4));
      if (y >= c.start - 1) active = i;
    });

    if (active !== current && chapters[active]) {
      current = active;
      const chapter = chapters[active];
      if (labelEl) labelEl.textContent = `${pad(active + 1)} — ${chapter.label}`;
      activeLink = pageLink ?? navLinks.find((a) => a.dataset.navSection === chapter.id) ?? null;
      navLinks.forEach((a) =>
        a.setAttribute('aria-current', a !== activeLink ? 'false' : a === pageLink ? 'page' : 'true'),
      );
      if (!hovered) movePill(activeLink);
    }

    const footerTop = footer?.getBoundingClientRect().top ?? Infinity;
    const inHero = y < window.innerHeight * 0.55;
    // La barre s'efface aussi devant les zones d'action (offres, boutons de contact) pour ne jamais les couvrir.
    const band = window.innerHeight - 110;
    const overAction = avoidZones.some((el) => {
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > band;
    });
    html.classList.toggle(
      'scrubber-hidden',
      chapters.length < 2 || inHero || overAction || footerTop < window.innerHeight - 40,
    );
  };

  const requestUpdate = (): void => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  /* ── Chapitres : construits à partir des sections [data-chapter] ── */
  const buildChapters = (): void => {
    const sections = $$('[data-chapter]');
    const max = Math.max(1, html.scrollHeight - window.innerHeight);
    const lead = window.innerHeight * 0.35;

    chapters = sections.map((el, i) => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      return {
        el,
        id: el.id,
        label: el.dataset.chapter ?? '',
        start: i === 0 ? 0 : clamp(top - lead, 0, max),
        end: max,
        fill: null,
      };
    });
    chapters.forEach((c, i) => {
      c.end = chapters[i + 1]?.start ?? max;
    });

    if (track) {
      track.replaceChildren(
        ...chapters.map((c, i) => {
          const li = document.createElement('li');
          li.style.flex = `${Math.max(c.end - c.start, 1)} 1 0`;

          const btn = document.createElement('button');
          btn.type = 'button';
          btn.setAttribute('aria-label', `Chapitre ${i + 1} : ${c.label}`);

          const seg = document.createElement('span');
          seg.className = 'seg';
          const fill = document.createElement('i');
          seg.append(fill);

          const tip = document.createElement('span');
          tip.className = 'tip';
          tip.textContent = `${pad(i + 1)} · ${c.label}`;

          btn.append(seg, tip);
          btn.addEventListener('click', () => smooth.scrollTo(i === 0 ? 0 : c.el));
          li.append(btn);
          c.fill = fill;
          return li;
        }),
      );
    }

    current = -1;
    update();
  };

  buildChapters();
  ScrollTrigger.addEventListener('refresh', buildChapters);
  cleanups.push(() => ScrollTrigger.removeEventListener('refresh', buildChapters));
  cleanups.push(listen(window, 'scroll', requestUpdate, { passive: true }));
  cleanups.push(() => cancelAnimationFrame(frame));

  /* ── Ancres internes (#services…) : défilement fluide ── */
  const onAnchorClick = (e: MouseEvent): void => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
    if (!link || link.target === '_blank') return;

    const url = new URL(link.href, window.location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;

    const id = decodeURIComponent(url.hash.slice(1));
    const target = id === 'top' ? 0 : document.getElementById(id);
    if (target === null) return;

    e.preventDefault();
    e.stopPropagation();
    document.dispatchEvent(new CustomEvent('nether:close-menu'));
    smooth.scrollTo(target);
    history.replaceState(history.state, '', id === 'top' ? url.pathname : url.hash);

    if (target instanceof HTMLElement) {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  };
  cleanups.push(listen(window, 'click', onAnchorClick, { capture: true }));

  /* ── Menu mobile (élément <dialog> natif : focus piégé, Échap) ── */
  const menu = $<HTMLDialogElement>('[data-menu]');
  const openBtn = $<HTMLButtonElement>('[data-menu-open]');
  const closeBtn = $<HTMLButtonElement>('[data-menu-close]');

  if (menu && openBtn) {
    const links = $$('.menu__link', menu);
    const foot = $('[data-menu-foot]', menu);
    let tl: gsap.core.Timeline | null = null;

    const finishClose = (): void => {
      if (menu.open) menu.close();
      openBtn.setAttribute('aria-expanded', 'false');
      gsap.set([menu, ...links, foot], { clearProps: 'all' });
      smooth.start();
    };

    const open = (): void => {
      if (menu.open) return;
      tl?.kill();
      menu.showModal();
      openBtn.setAttribute('aria-expanded', 'true');
      smooth.stop();
      if (prefersReducedMotion()) return;
      tl = gsap
        .timeline()
        .fromTo(menu, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.75, ease: 'expo.inOut' })
        .fromTo(
          links,
          { yPercent: 115, rotate: 5, transformOrigin: '0% 100%' },
          { yPercent: 0, rotate: 0, duration: 1, ease: 'expo.out', stagger: 0.06 },
          0.3,
        )
        .fromTo(foot, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out' }, 0.5);
    };

    const close = (immediate = false): void => {
      if (!menu.open) return;
      tl?.kill();
      if (immediate || prefersReducedMotion()) {
        finishClose();
        return;
      }
      tl = gsap.timeline({ onComplete: finishClose }).to(menu, {
        clipPath: 'inset(0% 0% 100% 0%)',
        duration: 0.6,
        ease: 'expo.inOut',
      });
    };

    cleanups.push(
      listen(openBtn, 'click', open),
      listen(closeBtn ?? menu, 'click', (e) => {
        if (closeBtn && e.currentTarget === closeBtn) close();
      }),
      listen(menu, 'cancel', (e) => {
        e.preventDefault();
        close();
      }),
      // Lien vers une autre page : on ferme tout de suite, la transition prend le relais.
      ...links.map((a) => listen(a, 'click', () => close(true))),
      listen(document, 'nether:close-menu', () => close(true)),
      () => close(true),
    );
  }

  return () => cleanups.forEach((fn) => fn());
}
