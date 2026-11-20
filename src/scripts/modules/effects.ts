/**
 * Effets réutilisables, activés par de simples attributs HTML :
 *   data-reveal="lines"    titre qui monte ligne par ligne (l'italique fait sa mise au point)
 *   data-reveal="fade"     fondu + léger mouvement
 *   data-reveal="stagger"  enfants en cascade
 *   data-reveal="cards"    cartes qui arrivent en profondeur (bascule 3D)
 *   data-reveal="wipe"     enfants dévoilés de gauche à droite, comme des clips posés sur la piste
 *   data-reveal="clip"     ouverture d'image
 *   data-reveal="scrub"    texte qui « s'allume » mot à mot au rythme du scroll
 *   data-reveal="chars"    lettres qui montent une à une
 *   data-reveal="track"    étiquette de piste (V1 · 01 — Services) qui se branche
 *   data-reveal="bars"     barres (SVG) qui se lèvent une à une
 *   data-reveal-delay="0.2"  data-reveal-start="top 80%"
 *   data-parallax="8"      parallaxe légère (en %)
 *   data-zoom="1.15"       image qui recule doucement pendant le scroll
 *   data-grow              barre qui se remplit au scroll
 *   data-count="600"       nombre qui défile jusqu'à sa valeur (data-count-format="mmss")
 *   data-draw              tracé SVG qui se dessine (pathLength="1")
 *   data-magnetic          bouton attiré par la souris
 *   data-tilt              carte inclinée en 3D
 *   data-marquee           bandeau qui défile en continu
 *   data-process           frise du processus
 * Tout est coupé si l'utilisateur préfère réduire les animations.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { $, $$, clamp, listen, type Cleanup } from '../lib/dom';

const revealed = new WeakSet<Element>();

function setupReveals(): void {
  $$('[data-reveal]').forEach((el) => {
    const type = el.dataset.reveal ?? 'fade';
    const delay = Number(el.dataset.revealDelay ?? 0);
    const start = el.dataset.revealStart ?? 'top 88%';
    const trigger = { trigger: el, start, once: true, onEnter: () => revealed.add(el) };

    /* Titres : lignes masquées qui montent en se redressant ;
       les mots en italique serif font leur « mise au point » juste après. */
    if (type === 'lines') {
      SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        linesClass: 'rl',
        autoSplit: true,
        onSplit(self) {
          gsap.set(el, { visibility: 'visible' });
          if (revealed.has(el)) return;
          const tl = gsap.timeline({ delay, scrollTrigger: trigger });
          tl.from(self.lines, {
            yPercent: 118,
            rotate: 2.5,
            transformOrigin: '0% 100%',
            duration: 1.25,
            ease: 'expo.out',
            stagger: 0.09,
          });
          const accents = el.querySelectorAll('.serif');
          if (accents.length) {
            tl.from(
              accents,
              { filter: 'blur(10px)', opacity: 0.25, duration: 1.3, ease: 'power3.out', clearProps: 'filter,opacity' },
              0.22,
            );
          }
          return tl;
        },
      });
      return;
    }

    /* Texte qui s'allume mot à mot, comme une tête de lecture qui passe. */
    if (type === 'scrub') {
      const split = SplitText.create(el, { type: 'words', wordsClass: 'sw' });
      gsap.set(el, { visibility: 'visible' });
      gsap.fromTo(
        split.words,
        { opacity: 0.16 },
        {
          opacity: 1,
          ease: 'none',
          stagger: 0.1,
          scrollTrigger: { trigger: el, start: 'top 85%', end: 'bottom 55%', scrub: 0.6 },
        },
      );
      return;
    }

    if (type === 'chars') {
      const split = SplitText.create(el, { type: 'chars', charsClass: 'sc' });
      gsap.set(el, { visibility: 'visible' });
      gsap.from(split.chars, {
        yPercent: 105,
        duration: 1.4,
        delay,
        ease: 'expo.out',
        stagger: 0.06,
        scrollTrigger: trigger,
      });
      return;
    }

    gsap.set(el, { visibility: 'visible' });

    switch (type) {
      case 'stagger':
        gsap.from(el.children, {
          y: 34,
          autoAlpha: 0,
          duration: 1,
          delay,
          ease: 'expo.out',
          stagger: 0.08,
          scrollTrigger: trigger,
        });
        break;

      /* Cartes : arrivent du bas en se redressant (le parent porte la perspective). */
      case 'cards':
        gsap.from(el.children, {
          y: 90,
          rotationX: -14,
          scale: 0.95,
          autoAlpha: 0,
          transformOrigin: '50% 100%',
          duration: 1.4,
          delay,
          ease: 'expo.out',
          stagger: { each: 0.11, from: (el.dataset.revealFrom as 'start' | 'center' | undefined) ?? 'start' },
          scrollTrigger: trigger,
        });
        break;

      /* Clips déposés sur la piste : chaque enfant se dévoile de gauche à droite. */
      case 'wipe':
        gsap.fromTo(
          el.children,
          { clipPath: 'inset(0% 100% 0% 0%)', x: -24 },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            x: 0,
            duration: 1.15,
            delay,
            ease: 'power4.inOut',
            stagger: 0.14,
            scrollTrigger: trigger,
            clearProps: 'clipPath',
          },
        );
        break;

      case 'clip':
        gsap.fromTo(
          el,
          { clipPath: 'inset(14% 10% 14% 10% round 28px)', autoAlpha: 0.2 },
          {
            clipPath: 'inset(0% 0% 0% 0% round 0px)',
            autoAlpha: 1,
            duration: 1.5,
            delay,
            ease: 'expo.out',
            scrollTrigger: trigger,
            clearProps: 'clipPath',
          },
        );
        break;

      /* Étiquette de piste : la pastille s'allume, le libellé glisse, le trait se tire. */
      case 'track': {
        const tl = gsap.timeline({ delay, scrollTrigger: trigger, defaults: { ease: 'expo.out' } });
        tl.from($('.track__id', el), { scale: 0.5, autoAlpha: 0, duration: 0.7, ease: 'back.out(2.2)' })
          .from($('.track__label', el), { x: -14, autoAlpha: 0, duration: 0.9 }, 0.08)
          .from($('.track__line', el), { scaleX: 0, transformOrigin: 'left center', duration: 1.4, ease: 'expo.inOut' }, 0.12);
        break;
      }

      case 'bars':
        gsap.from(el.children, {
          scaleY: 0,
          transformOrigin: '50% 50%',
          duration: 0.9,
          delay,
          ease: 'expo.out',
          stagger: 0.022,
          scrollTrigger: trigger,
        });
        break;

      default:
        gsap.from(el, { y: 30, autoAlpha: 0, duration: 1.1, delay, ease: 'expo.out', scrollTrigger: trigger });
    }
  });
}

function setupParallax(): void {
  $$('[data-parallax]').forEach((el) => {
    const amount = Number(el.dataset.parallax) || 8;
    gsap.fromTo(
      el,
      { yPercent: -amount },
      {
        yPercent: amount,
        ease: 'none',
        scrollTrigger: { trigger: el.parentElement ?? el, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });

  /* Image qui recule pendant qu'on la traverse : donne de la profondeur au cadre. */
  $$('[data-zoom]').forEach((el) => {
    const from = Number(el.dataset.zoom) || 1.15;
    gsap.fromTo(
      el,
      { scale: from },
      {
        scale: 1,
        ease: 'none',
        scrollTrigger: { trigger: el.parentElement ?? el, start: 'top bottom', end: 'bottom 35%', scrub: true },
      },
    );
  });
}

function setupGrow(): void {
  $$('[data-grow]').forEach((el) => {
    gsap.from(el, {
      scaleX: 0,
      transformOrigin: 'left center',
      duration: 1.6,
      delay: Number(el.dataset.growDelay ?? 0),
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });
}

const pad = (n: number): string => String(n).padStart(2, '0');

/** Nombres qui défilent jusqu'à leur valeur. Le texte d'origine est remis à la fin (et au démontage). */
function setupCounters(cleanups: Cleanup[]): void {
  $$('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count);
    if (!Number.isFinite(end)) return;
    const final = el.textContent ?? '';
    const format = el.dataset.countFormat ?? 'int';
    const state = { v: 0 };
    const render = (): void => {
      const v = Math.round(state.v);
      el.textContent = format === 'mmss' ? `${pad(Math.floor(v / 60))}:${pad(v % 60)}` : String(v);
    };
    render();
    gsap.to(state, {
      v: end,
      duration: Number(el.dataset.countDuration ?? 1.8),
      ease: 'expo.out',
      onUpdate: render,
      onComplete: () => {
        el.textContent = final;
      },
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
    cleanups.push(() => {
      el.textContent = final;
    });
  });
}

/** Tracés SVG qui se dessinent (le chemin doit porter pathLength="1"). */
function setupDraw(): void {
  $$<SVGGeometryElement>('[data-draw]').forEach((path) => {
    gsap.fromTo(
      path,
      { attr: { 'stroke-dasharray': 1, 'stroke-dashoffset': 1 } },
      {
        attr: { 'stroke-dashoffset': 0 },
        duration: 2.2,
        delay: Number(path.dataset.drawDelay ?? 0.3),
        ease: 'power2.inOut',
        scrollTrigger: { trigger: path.ownerSVGElement ?? path, start: 'top 82%', once: true },
      },
    );
  });
}

function setupMarquees(): void {
  $$('[data-marquee]').forEach((root) => {
    const trackEl = $('[data-marquee-track]', root);
    if (!trackEl) return;
    const tween = gsap.to(trackEl, {
      xPercent: -50,
      duration: Number(root.dataset.marquee) || 40,
      ease: 'none',
      repeat: -1,
    });
    // Marge de lecture en arrière : le bandeau peut repartir dans l'autre sens.
    tween.totalTime(tween.duration() * 200);

    const skewTo = gsap.quickTo(trackEl, 'skewX', { duration: 0.5, ease: 'power3.out' });
    const settle = gsap.delayedCall(0.18, () => skewTo(0)).pause();
    let direction = 1;

    // Le bandeau suit le sens du défilement, accélère avec sa vitesse et se penche légèrement.
    ScrollTrigger.create({
      trigger: root,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => (self.isActive ? tween.play() : tween.pause()),
      onUpdate: (self) => {
        const velocity = self.getVelocity();
        direction = self.direction;
        const boost = 1 + Math.min(Math.abs(velocity) / 500, 5);
        gsap.to(tween, { timeScale: boost * direction, duration: 0.2, overwrite: true });
        gsap.to(tween, { timeScale: direction, duration: 1.2, delay: 0.25, ease: 'power2.out' });
        skewTo(clamp(-velocity / 300, -6, 6));
        settle.restart(true);
      },
    });
  });
}

function setupProcess(animated: boolean): void {
  const root = $('[data-process]');
  if (!root) return;
  const steps = $$('[data-process-step]', root);
  const apply = (p: number): void => {
    root.style.setProperty('--progress', p.toFixed(4));
    steps.forEach((step, i) => step.classList.toggle('is-lit', p >= i / steps.length - 0.001));
  };

  if (!animated) {
    apply(1);
    return;
  }

  apply(0);
  ScrollTrigger.create({
    trigger: root,
    start: 'top 72%',
    end: 'bottom 55%',
    scrub: 0.6,
    onUpdate: (self) => apply(clamp(self.progress)),
  });
}

function setupMagnetic(cleanups: Cleanup[]): void {
  $$('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'expo.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'expo.out' });
    const strength = Number(el.dataset.magnetic) || 0.3;
    cleanups.push(
      listen<PointerEvent>(el, 'pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * strength);
        yTo((e.clientY - (r.top + r.height / 2)) * strength);
      }),
      listen(el, 'pointerleave', () => {
        xTo(0);
        yTo(0);
      }),
    );
  });
}

/** Le remplissage des boutons part du point d'entrée de la souris et repart par où elle sort. */
function setupFillOrigin(cleanups: Cleanup[]): void {
  $$('.btn, [data-fill-origin]').forEach((btn) => {
    const setOrigin = (e: PointerEvent): void => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty('--bx', `${(e.clientX - r.left).toFixed(1)}px`);
      btn.style.setProperty('--by', `${(e.clientY - r.top).toFixed(1)}px`);
    };
    cleanups.push(listen(btn, 'pointerenter', setOrigin), listen(btn, 'pointerleave', setOrigin));
  });
}

function setupTilt(cleanups: Cleanup[]): void {
  $$('[data-tilt]').forEach((el) => {
    const max = Number(el.dataset.tilt) || 5;
    gsap.set(el, { transformPerspective: 1100 });
    const rxTo = gsap.quickTo(el, 'rotationX', { duration: 0.8, ease: 'expo.out' });
    const ryTo = gsap.quickTo(el, 'rotationY', { duration: 0.8, ease: 'expo.out' });
    cleanups.push(
      listen<PointerEvent>(el, 'pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        rxTo(-py * max);
        ryTo(px * max);
      }),
      listen(el, 'pointerleave', () => {
        rxTo(0);
        ryTo(0);
      }),
    );
  });
}

/** Reflet lumineux qui suit la souris sur toutes les cartes (.card). */
function setupSpotlight(cleanups: Cleanup[]): void {
  cleanups.push(
    listen<PointerEvent>(
      document,
      'pointermove',
      (e) => {
        const card = (e.target as Element | null)?.closest?.('.card') as HTMLElement | null;
        if (!card) return;
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      },
      { passive: true },
    ),
  );
}

export function initEffects(): Cleanup {
  const mm = gsap.matchMedia();

  mm.add(
    {
      motion: '(prefers-reduced-motion: no-preference)',
      fine: '(hover: hover) and (pointer: fine)',
    },
    (context) => {
      const { motion, fine } = context.conditions as { motion: boolean; fine: boolean };
      const cleanups: Cleanup[] = [];

      if (motion) {
        setupReveals();
        setupParallax();
        setupGrow();
        setupCounters(cleanups);
        setupDraw();
        setupMarquees();
      }
      setupProcess(motion);

      if (fine) {
        setupSpotlight(cleanups);
        setupFillOrigin(cleanups);
        if (motion) {
          setupMagnetic(cleanups);
          setupTilt(cleanups);
        }
      }

      return () => cleanups.forEach((fn) => fn());
    },
  );

  return () => mm.revert();
}
