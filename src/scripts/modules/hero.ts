/**
 * Hero : entrée façon prise de vue, timecode « REC » en direct, tête de lecture
 * liée au scroll, profondeur à la souris et sortie en douceur au scroll.
 *
 * Séquence d'entrée (après l'intro ou la transition de page) :
 *  1. le viseur s'ouvre (les quatre coins partent du centre vers les bords) ;
 *  2. la ligne de présentation se « décode » comme un timecode ;
 *  3. les lignes du titre montent en se redressant, l'italique fait sa mise au point ;
 *  4. le point REC s'allume, puis le texte, les boutons et la timeline arrivent.
 */
import { gsap } from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { $, $$, hasFinePointer, listen, prefersReducedMotion, toTimecode, type Cleanup } from '../lib/dom';

gsap.registerPlugin(ScrambleTextPlugin);

export function initHero(ready: Promise<void>): Cleanup {
  const cleanups: Cleanup[] = [];
  const ctx = gsap.context(() => {});
  const items = $$('[data-hero]');
  const hero = $('[data-hero-root]');
  const reduce = prefersReducedMotion();
  let cancelled = false;
  /** Lance la boucle du moniteur (défini plus bas, appelé à la fin de l'entrée). */
  let startReel: (() => void) | null = null;

  /* ── Entrée ─────────────────────────────── */
  if (items.length && !reduce) {
    ready.then(() => {
      if (cancelled) return;
      ctx.add(() => {
        const lines = $$('[data-hero-line]');
        const frame = $('[data-hero-frame]');
        const strip = $('[data-hero-strip]');
        const monitorLink = $('[data-hero-monitor]');
        const others = items.filter(
          (el) => !el.querySelector('[data-hero-line]') && el !== frame && el !== strip && el !== monitorLink,
        );
        const clips = hero ? $$('[data-strip-clip]', hero) : [];
        const accents = lines.flatMap((l) => $$('em', l));
        const dot = $('.hero__dot');
        const scrambles = $$('[data-scramble]');

        const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
        tl.set(items, { visibility: 'visible' });

        // 1. Le viseur s'ouvre
        if (frame) {
          const corners = $$('.corners > i', frame);
          const tags = $$('.hero__tag', frame);
          tl.from(
            corners,
            {
              x: (i: number) => (i % 2 === 0 ? 70 : -70),
              y: (i: number) => (i < 2 ? 50 : -50),
              autoAlpha: 0,
              duration: 1.5,
              ease: 'expo.inOut',
            },
            0,
          ).from(tags, { autoAlpha: 0, y: 8, duration: 0.9, stagger: 0.1 }, 0.55);
        }

        // 2. Le texte de présentation se décode
        scrambles.forEach((el, i) => {
          const text = el.textContent ?? '';
          tl.to(
            el,
            { duration: 1.1, scrambleText: { text, chars: '0123456789:—', speed: 0.6, revealDelay: 0.15 }, ease: 'none' },
            0.2 + i * 0.18,
          );
        });

        // 3. Le titre monte, l'italique fait sa mise au point
        if (lines.length) {
          tl.from(lines, { yPercent: 115, rotate: 3, transformOrigin: '0% 100%', duration: 1.5, stagger: 0.12 }, 0.12);
        }
        if (accents.length) {
          tl.from(
            accents,
            { filter: 'blur(14px)', opacity: 0.15, duration: 1.6, ease: 'power3.out', clearProps: 'filter,opacity' },
            0.42,
          );
        }

        // 3 bis. Le moniteur s'allume : un trait de lumière, puis l'image s'ouvre comme un obturateur
        const monitor = monitorLink ? $('[data-monitor]', monitorLink) : null;
        const body = monitorLink ? $('[data-monitor-body]', monitorLink) : null;
        if (monitor && body) {
          const screen = $('.monitor__screen', body);
          const flash = $('[data-monitor-flash]', body);
          const poster = $('.monitor__poster', body);
          const chips = $$('[data-hero-chip]', monitor);
          const h = body.offsetHeight;
          const mid = screen ? screen.offsetTop + screen.offsetHeight / 2 : h / 2;

          tl.fromTo(
            body,
            { clipPath: `inset(${mid - 1}px 0px ${h - mid - 1}px 0px round 20px)` },
            { clipPath: 'inset(0px 0px 0px 0px round 20px)', duration: 1.2, ease: 'expo.inOut', clearProps: 'clipPath' },
            0.5,
          ).from(monitor, { scale: 1.1, duration: 1.7 }, 0.5);
          if (flash) {
            tl.fromTo(flash, { opacity: 1, scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: 'power3.out' }, 0.2).to(
              flash,
              { opacity: 0, duration: 0.6, ease: 'power2.out' },
              0.75,
            );
          }
          tl.from(body, { autoAlpha: 0, duration: 0.01 }, 0.2);
          if (poster) tl.from(poster, { scale: 1.35, duration: 2.2 }, 0.5);
          if (chips.length) {
            tl.from(chips, { scale: 0.6, autoAlpha: 0, y: 16, duration: 0.9, ease: 'back.out(2.2)', stagger: 0.14 }, 1.35);
          }
          tl.call(() => startReel?.(), [], 1.45);
        }

        // 4. Le point REC s'allume, le reste arrive
        if (dot) tl.from(dot, { scale: 0, duration: 0.9, ease: 'back.out(3)' }, 0.95);
        if (others.length) tl.from(others, { y: 30, autoAlpha: 0, duration: 1.2, stagger: 0.09 }, 0.45);
        if (strip) tl.from(strip, { y: 46, autoAlpha: 0, duration: 1.3 }, 0.6);
        if (clips.length) {
          tl.from(
            clips,
            { scaleX: 0, transformOrigin: 'left center', duration: 1.1, stagger: { each: 0.03, from: 'random' } },
            0.75,
          );
        }
      });
    });
  }

  if (!hero) {
    return () => {
      cancelled = true;
      ctx.revert();
    };
  }

  /* ── Tête de lecture liée au scroll ─────── */
  const strip = $('[data-strip]', hero);
  const head = $('[data-strip-head]', hero);
  if (strip && head && !reduce) {
    ctx.add(() => {
      gsap.fromTo(
        head,
        { x: () => strip.clientWidth * 0.18 },
        {
          x: () => strip.clientWidth - 2,
          ease: 'none',
          scrollTrigger: {
            trigger: hero,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.5,
            invalidateOnRefresh: true,
          },
        },
      );
    });
  } else if (strip && head) {
    gsap.set(head, { x: strip.clientWidth * 0.18 });
  }

  /* ── Sortie au scroll : le contenu recule et s'efface, le décor glisse moins vite ── */
  const content = $('[data-hero-content]', hero);
  const bg = $('[data-hero-bg]', hero);
  if (!reduce) {
    ctx.add(() => {
      const scroll = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
      // Sur mobile le hero dépasse l'écran : on garde le contenu net pendant qu'on le parcourt.
      if (content && window.matchMedia('(min-width: 64rem)').matches) {
        gsap.to(content, { y: 90, scale: 0.95, autoAlpha: 0.15, transformOrigin: '50% 0%', ease: 'none', scrollTrigger: scroll });
      }
      if (bg) gsap.to(bg, { yPercent: 22, ease: 'none', scrollTrigger: scroll });
      // Le moniteur remonte plus vite que le texte : les deux plans se séparent
      const monitorLink = $('[data-hero-monitor]', hero);
      // (grand écran uniquement : sur mobile il est dans le flux, sous les boutons)
      if (monitorLink && window.matchMedia('(min-width: 64rem)').matches) {
        gsap.to(monitorLink, { y: -110, ease: 'none', scrollTrigger: scroll });
      }
    });
  }

  /* ── Moniteur : boucle vidéo, timecode et progression ── */
  const monitor = $('[data-monitor]', hero);
  const reel = $<HTMLVideoElement>('[data-monitor-video]', hero);
  const wide = window.matchMedia('(min-width: 64rem)');
  if (monitor && !reduce) {
    // GSAP prend la main sur l'inclinaison (même valeurs que le CSS) pour pouvoir y ajouter la souris.
    const applyTilt = (): void => {
      gsap.set(monitor, wide.matches ? { rotationY: -11, rotationX: 3.5 } : { rotationY: 0, rotationX: 0 });
    };
    applyTilt();
    cleanups.push(listen(wide, 'change', applyTilt), () => gsap.set(monitor, { clearProps: 'transform' }));
  }

  if (monitor && reel && !reduce) {
    const tc = $('[data-monitor-tc]', hero);
    const bar = $('[data-monitor-progress]', hero);
    let wanted = false;
    let visible = true;

    const sync = (): void => {
      if (wanted && visible && document.visibilityState === 'visible') {
        reel.play().catch(() => {
          /* lecture automatique refusée : l'image fixe reste affichée */
        });
      } else {
        reel.pause();
      }
    };

    startReel = () => {
      if (cancelled || wanted) return;
      wanted = true;
      if (!reel.getAttribute('src') && reel.dataset.src) reel.src = reel.dataset.src;
      sync();
    };

    let lastTc = '';
    const tick = (): void => {
      if (reel.paused || !reel.duration) return;
      const value = toTimecode(reel.currentTime);
      if (value !== lastTc) {
        lastTc = value;
        if (tc) tc.textContent = value;
      }
      bar?.style.setProperty('--vp', (reel.currentTime / reel.duration).toFixed(4));
    };
    gsap.ticker.add(tick);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = Boolean(entry?.isIntersecting);
        sync();
      },
      { threshold: 0.15 },
    );
    io.observe(monitor);

    cleanups.push(
      listen(reel, 'playing', () => monitor.classList.add('is-live')),
      listen(document, 'visibilitychange', sync),
      () => gsap.ticker.remove(tick),
      () => io.disconnect(),
      () => reel.pause(),
    );
  }

  /* ── Timecode REC en direct (25 i/s) ────── */
  const liveTc = $$('[data-live-tc]', hero);
  if (liveTc.length && !reduce) {
    const start = performance.now();
    let last = '';
    const tick = (): void => {
      const value = toTimecode((performance.now() - start) / 1000);
      if (value === last) return;
      last = value;
      liveTc.forEach((el) => (el.textContent = value));
    };
    gsap.ticker.add(tick);
    cleanups.push(() => gsap.ticker.remove(tick));
  }

  /* ── Souris : lueur qui suit, calques qui glissent à des profondeurs différentes ── */
  const glow = $('[data-hero-glow]', hero);
  if (hasFinePointer() && !reduce) {
    const layers = $$('[data-depth]', hero).map((el) => ({
      depth: Number(el.dataset.depth) || 0,
      x: gsap.quickTo(el, 'x', { duration: 1.6, ease: 'power3.out' }),
      y: gsap.quickTo(el, 'y', { duration: 1.6, ease: 'power3.out' }),
    }));

    let glowX: ((v: number) => void) | null = null;
    let glowY: ((v: number) => void) | null = null;
    if (glow) {
      gsap.set(glow, { xPercent: -50, yPercent: -50, x: hero.clientWidth * 0.7, y: hero.clientHeight * 0.35 });
      glowX = gsap.quickTo(glow, 'x', { duration: 1.4, ease: 'power3.out' });
      glowY = gsap.quickTo(glow, 'y', { duration: 1.4, ease: 'power3.out' });
    }

    // Le moniteur pivote légèrement vers la souris ; la trame de points s'éclaire sous elle.
    const dots = $('[data-hero-dots]', hero);
    const tiltY = monitor ? gsap.quickTo(monitor, 'rotationY', { duration: 1.2, ease: 'power3.out' }) : null;
    const tiltX = monitor ? gsap.quickTo(monitor, 'rotationX', { duration: 1.2, ease: 'power3.out' }) : null;

    cleanups.push(
      listen<PointerEvent>(hero, 'pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        glowX?.(e.clientX - r.left);
        glowY?.(e.clientY - r.top);
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        layers.forEach((l) => {
          l.x(px * l.depth);
          l.y(py * l.depth);
        });
        if (wide.matches) {
          tiltY?.(-11 + px * 9);
          tiltX?.(3.5 - py * 7);
        }
        if (dots) {
          dots.style.setProperty('--gx', `${(e.clientX - r.left).toFixed(0)}px`);
          dots.style.setProperty('--gy', `${(e.clientY - r.top).toFixed(0)}px`);
        }
      }),
      listen(hero, 'pointerleave', () => {
        layers.forEach((l) => (l.x(0), l.y(0)));
        if (wide.matches) {
          tiltY?.(-11);
          tiltX?.(3.5);
        }
      }),
      () => gsap.set(layers.length ? $$('[data-depth]', hero) : [], { clearProps: 'x,y' }),
    );
  }

  return () => {
    cancelled = true;
    cleanups.forEach((fn) => fn());
    ctx.revert();
  };
}
