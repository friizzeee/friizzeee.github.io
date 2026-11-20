/**
 * « Behind the Edit » (src/components/home/Coulisses.astro) : la démonstration qui finit sur la carte Discord.
 *
 *  - Vidéo : chargée seulement quand on la lance (720p sur petit écran), muette, en pause hors écran.
 *  - Lumière : une copie minuscule de l'image, floutée derrière le cadre, reprend la couleur des LED.
 *  - Timeline : clips proportionnels, tête de lecture, moments forts cliquables, légende du moment.
 *  - Raccord (grand écran) : scène figée ; la caméra pousse dans le carton de fin, l'image s'éteint,
 *    la bande LED reste, la carte Discord arrive. La tête de lecture entre dans le clip « Votre projet ».
 *  - Téléphone : même contenu en colonne, la carte s'anime à son arrivée à l'écran.
 *  - Animations réduites : rien ne bouge seul, la vidéo attend un clic.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { $, $$, clamp, hasFinePointer, listen, prefersReducedMotion, toTimecode, type Cleanup } from '../lib/dom';
import { smooth } from '../lib/smooth';

gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin);

/** Repères du raccord, en part de la course figée (0 → 1). */
const PUSH_START = 0.3;
const CARD_IN = 0.56;
const BRIDGE_END = 0.78;

export function initCoulisses(): Cleanup {
  const root = $('[data-coul]');
  const scene = root ? $('[data-coul-scene]', root) : null;
  const video = root ? $<HTMLVideoElement>('[data-coul-video]', root) : null;
  if (!root || !scene || !video) return () => {};

  const cleanups: Cleanup[] = [];
  const reduce = prefersReducedMotion();
  const q = <T extends HTMLElement = HTMLElement>(sel: string): T | null => $<T>(sel, root);

  const wrap = q('[data-coul-wrap]');
  const frame = q('[data-coul-frame]');
  const endImg = q('[data-coul-end]');
  const ambient = q<HTMLCanvasElement>('[data-coul-ambient]');
  const led = q('[data-coul-led]');
  const wall = q('[data-coul-wall]');
  const rail = q('[data-coul-rail]');
  const head = q('[data-coul-head]');
  const next = q('[data-coul-next]');
  const tc = q('[data-coul-tc]');
  const capTitle = q('[data-coul-cap-title]');
  const capText = q('[data-coul-cap-text]');
  const toggleBtn = q<HTMLButtonElement>('[data-coul-toggle]');
  const soundBtn = q<HTMLButtonElement>('[data-coul-sound]');
  const startBtn = q<HTMLButtonElement>('[data-coul-start]');
  const contact = q('[data-coul-contact]');
  const clips = $$('[data-coul-clip]', root).map((el) => ({
    el,
    start: Number(el.dataset.start) || 0,
    len: Number(el.dataset.len) || 1,
    name: el.dataset.name ?? '',
  }));
  const markers = $$('[data-coul-marker]', root).map((el) => ({ el, at: Number(el.dataset.coulMarker) || 0 }));
  let texts: string[] = [];
  try {
    texts = JSON.parse(root.dataset.captions ?? '[]') as string[];
  } catch {
    texts = [];
  }

  const share = Number(rail?.dataset.share) || 0.82;
  const duration = (): number =>
    video.duration && Number.isFinite(video.duration) ? video.duration : Number(root.dataset.duration) || 42;

  /* ── Source : 720p sur petit écran ou connexion économe (rien n'est téléchargé avant la lecture) ── */
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (video.dataset.srcLight && (window.innerWidth < 1024 || connection?.saveData)) {
    video.src = video.dataset.srcLight;
  }
  // Nos propres commandes remplacent celles du navigateur (gardées sans JS).
  video.removeAttribute('controls');

  /* ── État de lecture ── */
  let wanted = !reduce; // lecture automatique souhaitée
  let userPaused = false;
  let inView = false;
  let held = false; // la caméra a commencé le raccord : la vidéo s'arrête
  let away = false; // le grand lecteur est ouvert
  let pendingSeek: number | null = null;
  let bridge = 0; // avancée de la tête de lecture dans « Votre projet »

  const setPlayingUi = (): void => {
    const playing = !video.paused && !video.ended;
    toggleBtn?.classList.toggle('is-playing', playing);
    toggleBtn?.classList.toggle('is-ended', video.ended);
    toggleBtn?.setAttribute('aria-label', video.ended ? 'Revoir' : playing ? 'Mettre en pause' : 'Lire');
  };

  const sync = (): void => {
    const should =
      wanted && !userPaused && inView && !held && !away && !video.ended && document.visibilityState === 'visible';
    if (should && video.paused) {
      video.play().catch(() => {
        // Lecture automatique refusée (économie d'énergie, réglage du navigateur) : un vrai bouton.
        if (startBtn) startBtn.hidden = false;
        wanted = false;
      });
    } else if (!should && !video.paused) {
      video.pause();
    }
  };

  const playFrom = (time?: number): void => {
    if (time !== undefined) {
      if (video.readyState >= 1) video.currentTime = time;
      else pendingSeek = time;
    } else if (video.ended) {
      video.currentTime = 0;
    }
    wanted = true;
    userPaused = false;
    if (startBtn) startBtn.hidden = true;
    root.classList.remove('is-ended');
    next?.classList.remove('is-cued');
    // Un clic est un geste du visiteur : on lance directement.
    video.play().catch(() => {});
  };

  if (reduce && startBtn) startBtn.hidden = false;

  /* ── Lumière d'ambiance : 48×27 pixels, redessinés 6 fois par seconde au plus ── */
  const ctx2d = ambient?.getContext('2d', { alpha: false }) ?? null;
  let lastPaint = 0;
  const paintAmbient = (source: CanvasImageSource): void => {
    if (!ctx2d || !ambient) return;
    try {
      ctx2d.drawImage(source, 0, 0, ambient.width, ambient.height);
    } catch {
      /* image pas encore décodée */
    }
  };
  // Avant la lecture : la lumière vient de l'affiche.
  if (video.poster) {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (video.readyState < 2) paintAmbient(img);
    };
    img.src = video.poster;
  }

  /* ── Timeline : tête de lecture, parties lues, légende, moments forts ── */
  let lastCaption = -2;
  let lastTc = '';
  let lastTime = 0;

  const setCaption = (index: number): void => {
    if (index === lastCaption || !capTitle || !capText) return;
    lastCaption = index;
    if (index === -1) {
      capTitle.textContent = 'Votre projet';
      capText.textContent = 'La prochaine séquence se monte avec vous : écrivez-moi sur Discord.';
    } else {
      capTitle.textContent = clips[index]?.name ?? '';
      capText.textContent = texts[index] ?? '';
    }
  };

  const render = (): void => {
    const total = duration();
    const t = clamp(video.currentTime, 0, total);
    const width = rail?.clientWidth ?? 0;

    // Tête : position dans la vidéo, puis glisse vers la fin du clip « Votre projet » pendant le raccord.
    const videoX = (t / total) * share * width;
    const x = videoX + (width - videoX) * bridge;
    if (head) head.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;

    clips.forEach((c) => c.el.style.setProperty('--fill', clamp((t - c.start) / c.len).toFixed(4)));
    next?.style.setProperty('--fill', clamp((x - share * width) / ((1 - share) * width || 1)).toFixed(4));

    if (bridge > 0.45) setCaption(-1);
    else {
      let index = 0;
      clips.forEach((c, i) => {
        if (t >= c.start) index = i;
      });
      setCaption(index);
    }

    const value = toTimecode(t, 30);
    if (value !== lastTc && tc) {
      lastTc = value;
      tc.textContent = value;
    }

    // La tête passe sur un moment fort : son étiquette s'allume un instant.
    if (!video.paused && t > lastTime) {
      markers.forEach((m) => {
        if (lastTime < m.at && t >= m.at) {
          m.el.classList.add('is-hit');
          gsap.delayedCall(2.6, () => m.el.classList.remove('is-hit'));
        }
      });
    }
    lastTime = t;
  };

  const tick = (time: number): void => {
    if (video.paused) return;
    render();
    if (!reduce && time - lastPaint > 0.16 && video.readyState >= 2) {
      lastPaint = time;
      paintAmbient(video);
    }
  };
  gsap.ticker.add(tick);
  cleanups.push(() => gsap.ticker.remove(tick));
  render();

  /* ── Événements de la vidéo ── */
  cleanups.push(
    listen(video, 'loadedmetadata', () => {
      if (pendingSeek !== null) {
        video.currentTime = pendingSeek;
        pendingSeek = null;
      }
      render();
    }),
    listen(video, 'play', setPlayingUi),
    listen(video, 'pause', setPlayingUi),
    listen(video, 'playing', () => {
      if (startBtn) startBtn.hidden = true;
    }),
    listen(video, 'seeked', () => {
      lastTime = video.currentTime;
      render();
      if (video.readyState >= 2) paintAmbient(video);
    }),
    listen(video, 'ended', () => {
      setPlayingUi();
      root.classList.add('is-ended');
      // La tête arrive au bout de la vidéo : le clip suivant l'appelle.
      next?.classList.add('is-cued');
      render();
    }),
    listen(document, 'visibilitychange', sync),
    listen(window, 'resize', render),
  );

  /* ── Commandes ── */
  if (toggleBtn) {
    cleanups.push(
      listen(toggleBtn, 'click', () => {
        if (video.ended || video.paused) playFrom();
        else {
          userPaused = true;
          video.pause();
        }
      }),
    );
  }

  if (soundBtn) {
    cleanups.push(
      listen(soundBtn, 'click', () => {
        video.muted = !video.muted;
        soundBtn.setAttribute('aria-pressed', String(!video.muted));
        soundBtn.setAttribute('aria-label', video.muted ? 'Activer le son' : 'Couper le son');
        if (!video.muted && video.paused) playFrom();
      }),
    );
  }

  if (startBtn) cleanups.push(listen(startBtn, 'click', () => playFrom()));

  $$('[data-coul-seek]', root).forEach((btn) => {
    cleanups.push(listen(btn, 'click', () => playFrom(Number(btn.dataset.coulSeek) || 0)));
  });

  // Le grand lecteur du site reprend là où en est la démo ; la démo s'arrête pendant ce temps.
  $$('[data-play-for="coulisses-film"]', root).forEach((btn) => {
    cleanups.push(
      listen(btn, 'click', () => {
        btn.dataset.playAt = video.ended ? '0' : video.currentTime.toFixed(2);
        away = true;
        sync();
      }),
    );
  });
  const dialog = $<HTMLDialogElement>('[data-player]');
  if (dialog) {
    cleanups.push(
      listen(dialog, 'close', () => {
        if (!away) return;
        away = false;
        sync();
      }),
    );
  }

  /* ── Visible ou non : la démo ne joue qu'à l'écran ── */
  const io = new IntersectionObserver(
    ([entry]) => {
      inView = Boolean(entry?.isIntersecting);
      sync();
    },
    { threshold: 0.35 },
  );
  if (frame) io.observe(frame);
  cleanups.push(
    () => io.disconnect(),
    () => video.pause(),
  );

  /* ── Reflet de la carte Discord sous la souris ── */
  const card = q('[data-dpc]');
  if (card && hasFinePointer()) {
    cleanups.push(
      listen<PointerEvent>(card, 'pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${(e.clientX - r.left).toFixed(0)}px`);
        card.style.setProperty('--my', `${(e.clientY - r.top).toFixed(0)}px`);
      }),
    );
  }

  /* ── Apparition de la carte : un seul mouvement orchestré ── */
  const buildCardTimeline = (): gsap.core.Timeline => {
    const stage = q('[data-dpc-stage]');
    const part = (name: string): HTMLElement | null => q(`[data-dpc-part="${name}"]`);
    const user = q('[data-dpc-user]');
    const handle = user?.textContent ?? '';
    const pitch = $$('[data-coul-pitch]', root);
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });

    tl.fromTo(pitch, { y: 34, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.1, stagger: 0.08 }, 0);
    if (stage) {
      tl.fromTo(
        stage,
        { y: 90, rotationX: -24, scale: 0.9, autoAlpha: 0, filter: 'blur(10px)', transformOrigin: '50% 100%' },
        { y: 0, rotationX: 0, scale: 1, autoAlpha: 1, filter: 'blur(0px)', duration: 1.4 },
        0.1,
      );
    }
    const parts: [string, gsap.TweenVars, number][] = [
      ['banner', { scaleY: 0, transformOrigin: '50% 0%' }, 0.3],
      ['avatar', { scale: 0.4, autoAlpha: 0 }, 0.5],
      ['name', { y: 12, autoAlpha: 0 }, 0.66],
      ['ids', { y: 10, autoAlpha: 0 }, 0.74],
      ['bio', { y: 10, autoAlpha: 0 }, 0.84],
      ['action', { y: 14, autoAlpha: 0 }, 0.96],
    ];
    parts.forEach(([name, from, at]) => {
      const el = part(name);
      if (!el) return;
      const to: gsap.TweenVars = { y: 0, scale: 1, scaleY: 1, autoAlpha: 1, duration: 0.9 };
      if (name === 'avatar') to.ease = 'back.out(1.7)';
      tl.fromTo(el, from, to, at);
    });
    if (user && handle) {
      tl.to(user, { duration: 0.9, scrambleText: { text: handle, chars: 'abcdefghijklmnopqrstuvwxyz_1', speed: 0.6 } }, 0.74);
    }
    return tl;
  };

  /* ── Mise en scène selon l'écran ── */
  const mm = gsap.matchMedia();

  mm.add('(min-width: 64rem) and (prefers-reduced-motion: no-preference)', () => {
    scene.classList.add('is-staged');
    const cardTl = buildCardTimeline();
    let cardShown = false;

    // Entrée : le moniteur, vu d'en bas sur le bureau, se redresse face au visiteur.
    if (wrap) {
      gsap.fromTo(
        wrap,
        { rotationX: 14, scale: 0.86, y: 70, transformPerspective: 1600 },
        {
          rotationX: 0,
          scale: 1,
          y: 0,
          ease: 'none',
          scrollTrigger: { trigger: scene, start: 'top bottom', end: 'top top', scrub: 0.6 },
        },
      );
    }
    // Raccord : positions exprimées en part de la course figée.
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: scene,
        start: 'top top',
        end: '+=160%',
        pin: true,
        scrub: 0.8,
        refreshPriority: 1,
        onUpdate: (self) => {
          const p = self.progress;
          const wasHeld = held;
          held = p > PUSH_START;
          bridge = clamp((p - PUSH_START) / (BRIDGE_END - PUSH_START));
          contact?.classList.toggle('is-open', p >= CARD_IN);
          if (p >= CARD_IN && !cardShown) {
            cardShown = true;
            cardTl.timeScale(1).play();
          } else if (p < CARD_IN - 0.08 && cardShown) {
            cardShown = false;
            cardTl.timeScale(2.2).reverse();
          }
          if (wasHeld !== held) sync();
          if (video.paused) render();
        },
      },
    });
    if (frame) tl.fromTo(frame, { scale: 1 }, { scale: 1.25, duration: 0.3, ease: 'power1.in' }, PUSH_START);
    if (endImg) tl.fromTo(endImg, { opacity: 0 }, { opacity: 1, duration: 0.08 }, PUSH_START);
    if (ambient) tl.to(ambient, { opacity: 0, duration: 0.16 }, PUSH_START + 0.06);
    // autoAlpha : une fois éteint, le cadre ne capte plus les clics (il ouvrirait le lecteur).
    if (frame) tl.to(frame, { autoAlpha: 0, duration: 0.12 }, PUSH_START + 0.2);
    if (led) tl.fromTo(led, { opacity: 0, scaleX: 0.25 }, { opacity: 1, scaleX: 1, duration: 0.18 }, PUSH_START + 0.12);
    if (wall) tl.fromTo(wall, { opacity: 0 }, { opacity: 1, duration: 0.2 }, PUSH_START + 0.14);
    tl.set({}, {}, 1);

    // Clavier : atteindre la carte encore cachée fait avancer la scène jusqu'à elle.
    const st = tl.scrollTrigger;
    const offFocus = contact
      ? listen(contact, 'focusin', () => {
          if (st && st.progress < CARD_IN) smooth.scrollTo(st.start + (st.end - st.start) * 0.9);
        })
      : null;

    return () => {
      offFocus?.();
      cardTl.kill();
      scene.classList.remove('is-staged');
      contact?.classList.remove('is-open');
      held = false;
      bridge = 0;
      sync();
      render();
    };
  });

  mm.add('(max-width: 63.99rem) and (prefers-reduced-motion: no-preference)', () => {
    const cardTl = buildCardTimeline();
    if (wrap) {
      gsap.fromTo(
        wrap,
        { rotationX: 10, scale: 0.94, transformPerspective: 1200 },
        {
          rotationX: 0,
          scale: 1,
          ease: 'none',
          scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'top 45%', scrub: 0.5 },
        },
      );
    }
    if (contact) {
      ScrollTrigger.create({ trigger: contact, start: 'top 72%', once: true, onEnter: () => cardTl.play() });
    }
    return () => cardTl.kill();
  });

  cleanups.push(() => mm.revert());

  return () => cleanups.forEach((fn) => fn());
}
