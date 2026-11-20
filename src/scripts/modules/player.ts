/**
 * Lecteur plein écran du portfolio (structure : components/portfolio/PlayerDialog.astro).
 *
 * Fichier vidéo
 *  - commandes du site : lecture, barre découpée par chapitres, son, 720p / 480p, plein écran ;
 *  - clavier : Espace ou K (lecture), ← → (5 s), ↑ ↓ (volume), M (son), F (plein écran), Début ;
 *  - états : chargement, erreur avec relance, fin de lecture ;
 *  - série : les vidéos qui partagent `data-group` s'enchaînent depuis le bandeau des parties.
 * YouTube
 *  - lecteur youtube-nocookie, chargé au clic, avec ses propres commandes.
 *
 * Rien n'est téléchargé avant le clic : la balise <video> est créée à l'ouverture et retirée à la fermeture.
 */
import { gsap } from 'gsap';
import { $, $$, clamp, hasFinePointer, listen, prefersReducedMotion, type Cleanup } from '../lib/dom';
import { smooth } from '../lib/smooth';

const YOUTUBE_ID = /^[A-Za-z0-9_-]{6,20}$/;
/** Durée sans activité avant que les commandes s'effacent pendant la lecture. */
const IDLE_MS = 2800;
/** Saut des flèches gauche / droite, en secondes. */
const SEEK_STEP = 5;

interface Chapter {
  /** Début, en secondes. */
  t: number;
  /** Libellé. */
  l: string;
}

interface Item {
  trigger: HTMLElement;
  src: string;
  /** Version allégée (480p), si elle existe. */
  light: string;
  poster: string;
  thumb: string;
  ratio: string;
  title: string;
  meta: string;
  credits: string;
  /** « Partie 1 », pour les séries. */
  part: string;
  /** Durée affichée avant le chargement, ex. « 6:27 ». */
  length: string;
  chapters: Chapter[];
}

type FullscreenVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };

/* Réglages gardés le temps de la visite (aucun stockage) : son, qualité choisie, position par vidéo. */
const session: { volume: number; muted: boolean; hd: boolean | null; positions: Map<string, number> } = {
  volume: 1,
  muted: false,
  hd: null,
  positions: new Map(),
};

/** 387 → « 6:27 ». */
const clock = (seconds: number): string => {
  const value = Math.max(0, Math.floor(seconds));
  const h = Math.floor(value / 3600);
  const m = Math.floor((value % 3600) / 60);
  const s = String(value % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
};

/** 387 → « 6 min 27 s » (lecteurs d'écran). */
const spoken = (seconds: number): string => {
  const value = Math.max(0, Math.round(seconds));
  const m = Math.floor(value / 60);
  return m > 0 ? `${m} min ${value % 60} s` : `${value} s`;
};

function parseChapters(raw: string | undefined): Chapter[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return (data as Partial<Chapter>[])
      .filter((c): c is Chapter => typeof c?.t === 'number' && typeof c?.l === 'string')
      .sort((a, b) => a.t - b.t);
  } catch {
    return [];
  }
}

function readItem(trigger: HTMLElement): Item {
  const d = trigger.dataset;
  return {
    trigger,
    src: d.src ?? '',
    light: d.srcLight ?? '',
    poster: d.poster ?? '',
    thumb: d.thumb ?? '',
    ratio: d.ratio ?? '16:9',
    title: d.title ?? '',
    meta: d.meta ?? '',
    credits: d.credits ?? '',
    part: d.part ?? '',
    length: d.length ?? '',
    chapters: parseChapters(d.chapters),
  };
}

/** Téléphone, économie de données ou réseau lent : on démarre sur la version allégée. */
function prefersLight(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
    .connection;
  if (connection?.saveData) return true;
  if (connection?.effectiveType && /(^|-)(2g|3g)$/.test(connection.effectiveType)) return true;
  const shortSide = Math.min(window.screen.width, window.screen.height);
  return window.matchMedia('(pointer: coarse)').matches && shortSide <= 540;
}

export function setupPlayer(cleanups: Cleanup[]): void {
  const dialog = $<HTMLDialogElement>('[data-player]');
  if (!dialog) return;
  const part = <T extends HTMLElement = HTMLElement>(name: string): T | null => $<T>(`[data-${name}]`, dialog);

  const panel = part('player-panel');
  const stage = part('player-stage');
  const frame = part('player-screen');
  const ui = part('pc');
  const seek = part('pc-seek');
  const range = part<HTMLInputElement>('pc-range');
  const toggleBtn = part<HTMLButtonElement>('pc-toggle');
  if (!panel || !stage || !frame || !ui || !seek || !range || !toggleBtn) return;

  const titleEl = part('player-title');
  const metaEl = part('player-meta');
  const creditsEl = part('player-credits');
  const closeBtn = part('player-close');
  const link = part<HTMLAnchorElement>('player-link');
  const parts = part('player-parts');
  const surface = part('pc-surface');
  const bottom = part('pc-bottom');
  const marks = part('pc-marks');
  const tip = part('pc-tip');
  const stateEl = part('pc-state');
  const currentEl = part('pc-current');
  const totalEl = part('pc-total');
  const chapterEl = part('pc-chapter');
  const muteBtn = part('pc-mute');
  const volumeInput = part<HTMLInputElement>('pc-volume');
  const qualityBtn = part('pc-quality');
  const qualityLabel = part('pc-quality-label');
  const fullBtn = part('pc-full');
  const endBox = part('pc-end');
  const endTitle = part('pc-end-title');
  const replayBtn = part('pc-replay');
  const nextBtn = part('pc-next');
  const nextLabel = part('pc-next-label');
  const errorBox = part('pc-error');
  const retryBtn = part('pc-retry');
  const lighterBtn = part('pc-lighter');

  const reduce = prefersReducedMotion();

  let video: HTMLVideoElement | null = null;
  let videoCleanups: Cleanup[] = [];
  let items: Item[] = [];
  let index = 0;
  let hd = true;
  let closing = false;
  /** Le visiteur tient la barre de lecture. */
  let seeking = false;
  /** Position demandée pendant qu'un saut est déjà en cours. */
  let queued: number | null = null;
  /** Position à appliquer dès que la vidéo connaît sa durée. */
  let pendingStart: number | null = null;
  /** Message à afficher au démarrage de la lecture (« Reprise à 2:14 »). */
  let announce = '';
  let waitingShown = false;
  let tapWoke = false;
  let lastSecond = -1;
  let idleTimer = 0;
  let waitTimer = 0;
  let stateTimer = 0;

  const current = (): Item | undefined => items[index];
  const total = (): number => (video && Number.isFinite(video.duration) ? video.duration : 0);
  const sourceOf = (item: Item): string => (item.light && !hd ? item.light : item.src);

  const chapterAt = (time: number): Chapter | undefined => {
    let found: Chapter | undefined;
    for (const chapter of current()?.chapters ?? []) {
      if (chapter.t > time + 0.05) break;
      found = chapter;
    }
    return found;
  };

  const hide = (box: HTMLElement | null, flag: string): void => {
    if (box) box.hidden = true;
    ui.classList.remove(flag);
  };

  /* ── Message d'état, en haut à gauche de l'image ── */
  const setState = (text: string, ms = 0): void => {
    window.clearTimeout(stateTimer);
    if (text && stateEl) stateEl.textContent = text;
    ui.classList.toggle('has-state', text !== '');
    if (text && ms) stateTimer = window.setTimeout(() => setState(''), ms);
  };

  /* Le mot « Chargement » n'apparaît que si l'attente dure : pas de clignotement sur une bonne connexion. */
  const startWaiting = (): void => {
    ui.classList.add('is-waiting');
    window.clearTimeout(waitTimer);
    waitTimer = window.setTimeout(() => {
      waitingShown = true;
      setState('Chargement');
    }, 350);
  };

  const stopWaiting = (): void => {
    ui.classList.remove('is-waiting');
    window.clearTimeout(waitTimer);
    if (!waitingShown) return;
    waitingShown = false;
    setState('');
  };

  /* ── Les commandes s'effacent pendant la lecture, et reviennent au moindre geste ── */
  const wake = (): void => {
    ui.classList.remove('is-idle');
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => {
      // Elles restent tant que la vidéo est à l'arrêt ou charge encore, ou que le visiteur s'en sert.
      if (!video || video.paused || seeking || ui.classList.contains('is-waiting')) return;
      if (hasFinePointer() && bottom?.querySelector(':hover')) return;
      ui.classList.add('is-idle');
    }, IDLE_MS);
  };

  /* ── Affichage : barre, temps, chapitre en cours ── */
  const render = (at?: number): void => {
    const v = video;
    if (!v) return;
    const d = total();
    const t = at ?? v.currentTime;
    ui.style.setProperty('--played', d ? clamp(t / d).toFixed(4) : '0');

    let loaded = 0;
    for (let i = 0; i < v.buffered.length; i += 1) {
      if (v.buffered.start(i) <= t + 0.25 && t <= v.buffered.end(i)) {
        loaded = v.buffered.end(i);
        break;
      }
    }
    ui.style.setProperty('--buffered', d ? clamp(loaded / d).toFixed(4) : '0');

    if (currentEl) currentEl.textContent = clock(t);
    const label = chapterAt(t)?.l ?? '';
    if (chapterEl && chapterEl.textContent !== label) chapterEl.textContent = label;

    // Le reste n'a besoin d'être mis à jour qu'une fois par seconde.
    const second = Math.floor(t);
    if (second === lastSecond) return;
    lastSecond = second;
    range.value = String(second);
    range.setAttribute('aria-valuetext', `${spoken(t)} sur ${spoken(d)}${label ? `, chapitre : ${label}` : ''}`);
    const tab = parts?.children[index];
    if (tab instanceof HTMLElement) tab.style.setProperty('--pp', d ? clamp(t / d).toFixed(4) : '0');
  };

  const drawMarks = (d: number): void => {
    if (!marks) return;
    marks.replaceChildren();
    if (!d) return;
    for (const chapter of current()?.chapters ?? []) {
      if (chapter.t <= 0 || chapter.t >= d) continue;
      const mark = document.createElement('i');
      mark.style.left = `${((chapter.t / d) * 100).toFixed(3)}%`;
      marks.append(mark);
    }
  };

  /* ── Lecture ── */
  const play = (): void => {
    video?.play().catch(() => {
      /* lecture automatique refusée : le grand bouton reste affiché */
    });
  };

  const toggle = (): void => {
    const v = video;
    if (!v) return;
    if (v.ended) {
      v.currentTime = 0;
      play();
    } else if (v.paused) play();
    else v.pause();
  };

  const seekTo = (time: number): void => {
    const v = video;
    if (!v) return;
    const d = total();
    if (!d) {
      pendingStart = Math.max(0, time);
      return;
    }
    const t = clamp(time, 0, Math.max(0, d - 0.1));
    const restart = v.ended;
    if (v.seeking) queued = t;
    else v.currentTime = t;
    hide(endBox, 'is-ended');
    render(t);
    if (restart) play();
  };

  const setVolume = (value: number): void => {
    const v = video;
    if (!v) return;
    v.volume = clamp(value);
    v.muted = v.volume === 0;
  };

  const syncVolume = (): void => {
    const v = video;
    if (!v) return;
    session.volume = v.volume;
    session.muted = v.muted;
    const silent = v.muted || v.volume === 0;
    ui.classList.toggle('is-muted', silent);
    muteBtn?.setAttribute('aria-pressed', String(silent));
    if (volumeInput) {
      volumeInput.value = String(silent ? 0 : v.volume);
      volumeInput.style.setProperty('--v', volumeInput.value);
    }
  };

  /* ── Qualité : 720p par défaut, 480p sur téléphone ou connexion lente ── */
  const syncQuality = (item: Item): void => {
    if (lighterBtn) lighterBtn.hidden = !item.light || !hd;
    if (!qualityBtn) return;
    qualityBtn.hidden = !item.light;
    qualityBtn.dataset.hd = String(hd);
    if (qualityLabel) qualityLabel.textContent = hd ? '720p' : '480p';
    qualityBtn.setAttribute('aria-label', hd ? 'Qualité : 720p. Passer en 480p' : 'Qualité : 480p. Passer en 720p');
  };

  /** Recharge la source en cours (autre qualité, ou nouvelle tentative) en gardant la position. */
  const reload = (item: Item, resume: boolean): void => {
    const v = video;
    if (!v) return;
    const at = v.currentTime;
    hide(endBox, 'is-ended');
    hide(errorBox, 'is-error');
    queued = null;
    pendingStart = at > 0 ? at : null;
    startWaiting();
    v.src = sourceOf(item);
    if (resume) play();
  };

  const setQuality = (value: boolean): void => {
    const v = video;
    const item = current();
    if (!v || !item?.light || value === hd) return;
    const resume = !v.paused || ui.classList.contains('is-error');
    hd = value;
    session.hd = value;
    syncQuality(item);
    announce = value ? 'Qualité 720p' : 'Qualité 480p';
    reload(item, resume);
  };

  /* ── Plein écran : l'image et ses commandes ; sur iPhone, le plein écran du système ── */
  const nativeFullscreen = (): void => {
    (video as FullscreenVideo | null)?.webkitEnterFullscreen?.();
  };

  const toggleFull = (): void => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      return;
    }
    if (typeof stage.requestFullscreen === 'function') stage.requestFullscreen().catch(nativeFullscreen);
    else nativeFullscreen();
  };

  /* ── Série : une touche par partie, sous l'image ── */
  const buildParts = (): void => {
    if (!parts) return;
    parts.replaceChildren();
    const many = items.length > 1;
    parts.hidden = !many;
    dialog.classList.toggle('has-parts', many);
    if (!many) return;

    items.forEach((item, i) => {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'part';
      tab.dataset.part = String(i);

      if (item.thumb) {
        const img = document.createElement('img');
        img.className = 'part__thumb';
        img.src = item.thumb;
        img.alt = '';
        img.width = 160;
        img.height = 90;
        img.decoding = 'async';
        tab.append(img);
      }

      const text = document.createElement('span');
      text.className = 'part__txt';
      const name = document.createElement('span');
      name.className = 'part__name';
      name.textContent = item.part || `Partie ${i + 1}`;
      text.append(name);
      if (item.length) {
        const length = document.createElement('span');
        length.className = 'part__len mono';
        length.textContent = item.length;
        text.append(length);
      }

      const bar = document.createElement('i');
      bar.className = 'part__bar';
      tab.append(text, bar);
      parts.append(tab);
    });
  };

  /** Mémorise où le visiteur s'est arrêté, pour reprendre s'il rouvre la vidéo pendant sa visite. */
  const remember = (): void => {
    const item = current();
    const d = total();
    if (!video || !item || !d) return;
    const t = video.currentTime;
    if (t > 5 && t < d - 8) session.positions.set(item.src, Math.max(0, t - 2));
    else session.positions.delete(item.src);
  };

  /** Charge une vidéo de la liste. Sans `start`, reprend là où le visiteur s'était arrêté. */
  const load = (next: number, start?: number): void => {
    const v = video;
    const item = items[next];
    if (!v || !item) return;
    remember();
    index = next;
    lastSecond = -1;
    queued = null;
    hd = item.light ? (session.hd ?? !prefersLight()) : true;

    if (titleEl) titleEl.textContent = item.title;
    if (metaEl) metaEl.textContent = item.meta;
    if (creditsEl) {
      creditsEl.textContent = item.credits;
      creditsEl.hidden = !item.credits;
    }
    stage.style.aspectRatio = item.ratio === '9:16' ? '9 / 16' : '16 / 9';
    dialog.dataset.ratio = item.ratio;

    hide(endBox, 'is-ended');
    hide(errorBox, 'is-error');
    ui.classList.add('is-paused');
    ui.style.setProperty('--played', '0');
    ui.style.setProperty('--buffered', '0');
    if (currentEl) currentEl.textContent = '0:00';
    if (totalEl) totalEl.textContent = item.length || '0:00';
    if (chapterEl) chapterEl.textContent = item.chapters[0]?.l ?? '';
    marks?.replaceChildren();
    range.max = '0';
    range.value = '0';
    syncQuality(item);
    Array.from(parts?.children ?? []).forEach((tab, i) => {
      if (i === index) tab.setAttribute('aria-current', 'true');
      else tab.removeAttribute('aria-current');
    });

    const from = start ?? session.positions.get(item.src) ?? 0;
    pendingStart = from > 0 ? from : null;
    announce = start === undefined && from > 0 ? `Reprise à ${clock(from)}` : '';

    if (item.poster) v.poster = item.poster;
    else v.removeAttribute('poster');
    startWaiting();
    v.src = sourceOf(item);
    play();
    wake();
  };

  /* ── Événements de la vidéo ── */
  const onMeta = (): void => {
    const v = video;
    if (!v) return;
    const d = total();
    range.max = String(Math.floor(d));
    // La durée saisie dans les données fait foi (même valeur que sur la carte) ; sinon, celle du fichier.
    if (totalEl) totalEl.textContent = current()?.length || clock(d);
    drawMarks(d);
    if (pendingStart !== null) {
      v.currentTime = clamp(pendingStart, 0, Math.max(0, d - 1));
      pendingStart = null;
    }
    lastSecond = -1;
    render();
  };

  const onEnded = (): void => {
    const item = current();
    const next = items[index + 1];
    ui.classList.add('is-ended', 'is-paused');
    if (endTitle) endTitle.textContent = item?.part ? `${item.part} terminée` : 'Vidéo terminée';
    if (nextBtn) nextBtn.hidden = !next;
    if (next && nextLabel) {
      nextLabel.textContent = `${next.part || 'Vidéo suivante'}${next.length ? ` · ${next.length}` : ''}`;
    }
    if (endBox) endBox.hidden = false;
    // Le compteur s'arrête sur la durée annoncée (6:27 / 6:27), pas une seconde avant.
    if (currentEl && totalEl) currentEl.textContent = totalEl.textContent;
    if (item) session.positions.delete(item.src);
    wake();
    // Au clavier, le focus passe sur l'action suivante ; à la souris, on ne déplace rien.
    if (ui.contains(document.activeElement)) (next ? nextBtn : replayBtn)?.focus({ preventScroll: true });
  };

  const onError = (): void => {
    if (!video?.error) return;
    stopWaiting();
    ui.classList.add('is-error', 'is-paused');
    if (errorBox) errorBox.hidden = false;
    wake();
  };

  const mount = (): HTMLVideoElement => {
    const el = document.createElement('video');
    el.playsInline = true;
    el.preload = 'auto';
    el.volume = session.volume;
    el.muted = session.muted;
    frame.replaceChildren(el);

    videoCleanups = [
      listen(el, 'loadstart', startWaiting),
      listen(el, 'loadedmetadata', onMeta),
      listen(el, 'waiting', startWaiting),
      listen(el, 'canplay', stopWaiting),
      listen(el, 'playing', () => {
        stopWaiting();
        wake(); // le compte à rebours des commandes repart quand l'image bouge vraiment
        if (!announce) return;
        setState(announce, 2600);
        announce = '';
      }),
      listen(el, 'play', () => {
        ui.classList.remove('is-paused');
        hide(endBox, 'is-ended');
        toggleBtn.setAttribute('aria-label', 'Pause');
        wake();
      }),
      listen(el, 'pause', () => {
        ui.classList.add('is-paused');
        toggleBtn.setAttribute('aria-label', 'Lecture');
        wake();
      }),
      listen(el, 'timeupdate', () => {
        if (!seeking) render();
      }),
      listen(el, 'progress', () => {
        if (!seeking) render();
      }),
      listen(el, 'seeked', () => {
        if (queued !== null) {
          const t = queued;
          queued = null;
          el.currentTime = t;
        } else if (!seeking) render();
      }),
      listen(el, 'ended', onEnded),
      listen(el, 'error', onError),
      listen(el, 'volumechange', syncVolume),
    ];
    return el;
  };

  /** Coupe la vidéo, libère le téléchargement et remet le lecteur à zéro. */
  const unmount = (): void => {
    remember();
    window.clearTimeout(idleTimer);
    window.clearTimeout(waitTimer);
    window.clearTimeout(stateTimer);
    videoCleanups.forEach((fn) => fn());
    videoCleanups = [];
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
    video = null;
    items = [];
    index = 0;
    seeking = false;
    queued = null;
    pendingStart = null;
    announce = '';
    waitingShown = false;
    frame.replaceChildren();
    ui.hidden = true;
    ui.classList.remove('is-idle', 'is-seeking', 'is-waiting', 'is-ended', 'is-error', 'is-full', 'has-state');
    ui.classList.add('is-paused');
    if (endBox) endBox.hidden = true;
    if (errorBox) errorBox.hidden = true;
    if (parts) {
      parts.replaceChildren();
      parts.hidden = true;
    }
    dialog.classList.remove('has-parts');
  };

  /* ── Ouverture / fermeture de la fenêtre ── */
  const open = (trigger: HTMLElement, start?: number): void => {
    const kind = trigger.dataset.kind ?? 'file';
    const src = trigger.dataset.src ?? '';
    if (!src || (kind === 'youtube' && !YOUTUBE_ID.test(src))) return;

    unmount();

    if (kind === 'youtube') {
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${src}?autoplay=1&rel=0&playsinline=1`;
      iframe.title = trigger.dataset.title ?? 'Vidéo YouTube';
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      iframe.allowFullscreen = true;
      frame.replaceChildren(iframe);

      const ratio = trigger.dataset.ratio ?? '16:9';
      stage.style.aspectRatio = ratio === '9:16' ? '9 / 16' : '16 / 9';
      dialog.dataset.ratio = ratio;
      if (titleEl) titleEl.textContent = trigger.dataset.title ?? '';
      if (metaEl) metaEl.textContent = trigger.dataset.meta ?? '';
      if (creditsEl) {
        creditsEl.textContent = trigger.dataset.credits ?? '';
        creditsEl.hidden = !trigger.dataset.credits;
      }
      if (link) {
        // Uniquement pour YouTube, et seulement vers youtube.com
        link.href = `https://www.youtube.com/watch?v=${src}`;
        link.hidden = false;
      }
    } else {
      // Les vidéos d'une même série (même data-group) forment la liste de lecture.
      const group = trigger.dataset.group;
      const siblings = group
        ? $$('[data-play][data-group]').filter(
            (el) => el.dataset.group === group && (el.dataset.kind ?? 'file') === 'file',
          )
        : [];
      const list = siblings.includes(trigger) ? siblings : [trigger];
      items = list.map(readItem);
      index = list.indexOf(trigger);
      video = mount();
      ui.hidden = false;
      buildParts();
      syncVolume();
      if (link) {
        link.hidden = true;
        link.removeAttribute('href');
      }
      load(index, start);
    }

    // Réouverture pendant l'animation de fermeture : on l'interrompt au lieu d'ignorer le clic.
    closing = false;
    gsap.killTweensOf([dialog, panel]);
    if (!dialog.open) dialog.showModal();
    if (reduce) gsap.set([dialog, panel], { clearProps: 'all' });
    smooth.stop();
    if (!reduce) {
      gsap.fromTo(dialog, { backgroundColor: 'rgba(6,6,7,0)' }, { backgroundColor: 'rgba(6,6,7,0.92)', duration: 0.5 });
      // Opacité seule (pas de visibility) : le bouton de lecture doit pouvoir recevoir le focus tout de suite.
      gsap.fromTo(panel, { y: 50, scale: 0.96, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.8, ease: 'expo.out' });
    }
    // Espace met en pause dès l'ouverture, au lieu de tomber sur « Fermer ».
    if (kind !== 'youtube') toggleBtn.focus({ preventScroll: true });
  };

  const finish = (): void => {
    if (dialog.open) dialog.close();
  };

  const close = (): void => {
    if (!dialog.open || closing) return;
    closing = true;
    if (reduce) return finish();
    gsap.to(panel, { y: 30, opacity: 0, scale: 0.98, duration: 0.35, ease: 'power2.in' });
    gsap.to(dialog, { backgroundColor: 'rgba(6,6,7,0)', duration: 0.4, onComplete: finish });
  };

  /* ── Barre de lecture : souris et doigt ── */
  const pointerTime = (e: PointerEvent): { time: number; x: number; width: number } => {
    const box = seek.getBoundingClientRect();
    const x = clamp(e.clientX - box.left, 0, box.width);
    return { time: box.width ? (x / box.width) * total() : 0, x, width: box.width };
  };

  const showTip = (time: number, x: number, width: number): void => {
    if (!tip) return;
    const chapter = chapterAt(time);
    tip.textContent = chapter ? `${clock(time)} · ${chapter.l}` : clock(time);
    const half = Math.min(tip.offsetWidth / 2, width / 2);
    tip.style.setProperty('--tip-x', `${clamp(x, half, width - half).toFixed(1)}px`);
  };

  const endSeek = (): void => {
    if (!seeking) return;
    seeking = false;
    ui.classList.remove('is-seeking');
    wake();
  };

  cleanups.push(
    // Ouverture : une carte, ou une ligne de chapitre qui renvoie à sa carte.
    listen(document, 'click', (e) => {
      const target = e.target as Element | null;
      // Un chapitre (ou le grand bouton d'une page projet) renvoie au bouton de sa vidéo.
      // Avec data-play-at, la lecture part de cet instant ; sans, elle reprend là où le visiteur s'était arrêté.
      const relay = target?.closest?.<HTMLElement>('[data-play-for]');
      if (relay) {
        const owner = document.getElementById(relay.dataset.playFor ?? '');
        if (!owner) return;
        e.preventDefault();
        const at = relay.dataset.playAt;
        open(owner, at === undefined ? undefined : Number(at) || 0);
        return;
      }
      const trigger = target?.closest?.<HTMLElement>('[data-play]');
      if (!trigger) return;
      e.preventDefault();
      open(trigger);
    }),

    listen(dialog, 'cancel', (e) => {
      e.preventDefault();
      close();
    }),
    listen(dialog, 'click', (e) => {
      if (e.target === dialog) close();
    }),
    // Fermeture (quelle qu'en soit la cause) : on coupe la vidéo et on rend le scroll.
    listen(dialog, 'close', () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      unmount();
      gsap.set([dialog, panel], { clearProps: 'all' });
      smooth.start();
    }),

    listen<KeyboardEvent>(dialog, 'keydown', (e) => {
      const v = video;
      if (!v || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const onVolume = target === volumeInput;
      const from = queued ?? v.currentTime;
      switch (e.key) {
        case ' ':
          // Sur un bouton, Espace garde son rôle habituel.
          if (target?.closest('button, a')) return;
          toggle();
          break;
        case 'k':
        case 'K':
          toggle();
          break;
        case 'ArrowLeft':
          if (onVolume) return;
          seekTo(from - SEEK_STEP);
          break;
        case 'ArrowRight':
          if (onVolume) return;
          seekTo(from + SEEK_STEP);
          break;
        case 'ArrowUp':
          if (onVolume) return;
          setVolume(v.volume + 0.1);
          break;
        case 'ArrowDown':
          if (onVolume) return;
          setVolume(v.volume - 0.1);
          break;
        case 'Home':
          if (onVolume) return;
          seekTo(0);
          break;
        case 'm':
        case 'M':
          v.muted = !v.muted;
          break;
        case 'f':
        case 'F':
          toggleFull();
          break;
        default:
          return;
      }
      e.preventDefault();
      wake();
    }),

    listen(stage, 'pointermove', wake),
    listen(stage, 'pointerdown', wake),
    listen(ui, 'focusin', wake),
    listen(document, 'fullscreenchange', () => {
      const full = document.fullscreenElement === stage;
      ui.classList.toggle('is-full', full);
      fullBtn?.setAttribute('aria-pressed', String(full));
      wake();
    }),

    listen(toggleBtn, 'click', toggle),
    listen<PointerEvent>(seek, 'pointerdown', (e) => {
      if ((e.pointerType === 'mouse' && e.button !== 0) || !total()) return;
      e.preventDefault();
      seeking = true;
      ui.classList.add('is-seeking');
      try {
        // Le glissement continue même si le doigt ou la souris sort de la barre.
        seek.setPointerCapture(e.pointerId);
      } catch {
        /* pointeur déjà relâché : le saut à la position cliquée suffit */
      }
      const p = pointerTime(e);
      showTip(p.time, p.x, p.width);
      seekTo(p.time);
    }),
    listen<PointerEvent>(seek, 'pointermove', (e) => {
      if (!total()) return;
      const p = pointerTime(e);
      showTip(p.time, p.x, p.width);
      if (seeking) seekTo(p.time);
    }),
    listen(seek, 'pointerup', endSeek),
    listen(seek, 'pointercancel', endSeek),
    listen(seek, 'lostpointercapture', endSeek),
    // Clavier et lecteurs d'écran : le curseur natif, par pas de 5 secondes.
    listen(range, 'input', () => seekTo(Number(range.value))),
  );

  if (closeBtn) cleanups.push(listen(closeBtn, 'click', close));

  if (surface) {
    cleanups.push(
      // Au doigt, le premier appui réveille les commandes ; le suivant met en pause.
      listen<PointerEvent>(surface, 'pointerdown', (e) => {
        tapWoke = e.pointerType !== 'mouse' && ui.classList.contains('is-idle');
      }),
      listen(surface, 'click', () => {
        if (tapWoke) {
          tapWoke = false;
          return;
        }
        toggle();
      }),
    );
  }

  if (muteBtn) {
    cleanups.push(
      listen(muteBtn, 'click', () => {
        const v = video;
        if (!v) return;
        v.muted = !v.muted;
        if (!v.muted && v.volume === 0) v.volume = 0.5;
      }),
    );
  }
  if (volumeInput) cleanups.push(listen(volumeInput, 'input', () => setVolume(Number(volumeInput.value))));
  if (qualityBtn) cleanups.push(listen(qualityBtn, 'click', () => setQuality(!hd)));
  if (fullBtn) cleanups.push(listen(fullBtn, 'click', toggleFull));

  if (replayBtn) {
    cleanups.push(
      listen(replayBtn, 'click', () => {
        const v = video;
        if (!v) return;
        hide(endBox, 'is-ended');
        v.currentTime = 0;
        play();
        toggleBtn.focus({ preventScroll: true });
      }),
    );
  }
  if (nextBtn) {
    cleanups.push(
      listen(nextBtn, 'click', () => {
        load(index + 1, 0);
        toggleBtn.focus({ preventScroll: true });
      }),
    );
  }
  if (retryBtn) {
    cleanups.push(
      listen(retryBtn, 'click', () => {
        const item = current();
        if (item) reload(item, true);
      }),
    );
  }
  if (lighterBtn) cleanups.push(listen(lighterBtn, 'click', () => setQuality(false)));

  if (parts) {
    cleanups.push(
      listen(parts, 'click', (e) => {
        const tab = (e.target as Element | null)?.closest<HTMLElement>('.part');
        const next = Number(tab?.dataset.part);
        if (!tab || !Number.isInteger(next) || next === index) return;
        load(next);
      }),
    );
  }

  // Changement de page : on coupe tout, même si la fenêtre est encore ouverte.
  cleanups.push(() => {
    unmount();
    finish();
  });
}
