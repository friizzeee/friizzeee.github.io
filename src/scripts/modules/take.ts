/**
 * Le plan-séquence de l'accueil, une balade dans le studio (structure et styles : components/home/Take.astro).
 *
 * Le décor et le trajet de la caméra sont rendus dans Blender (tools/plan-sequence/render_walk.py) :
 * public/plan/<format>/NNNN.webp, et corners.json qui donne, image par image, les quatre coins de chaque écran
 * du décor quand il est entièrement visible. Le défilement choisit l'image ; les vraies boucles vidéo sont
 * calées en perspective sur leurs écrans (matrix3d), à la taille qu'ils ont dans l'image : jamais en plein cadre.
 *
 * Fluidité :
 *  - les images se téléchargent en commençant par celles qui sont devant soi ;
 *  - elles sont décodées à l'avance (ImageBitmap) autour de l'image regardée : le dessin n'attend jamais
 *    un décodage, et la mémoire est rendue au fil de la marche ;
 *  - deux images voisines sont fondues l'une dans l'autre, et les écrans vidéo suivent par interpolation :
 *    la caméra glisse au lieu d'avancer par à-coups.
 *
 * Tout découle d'une valeur, `u` : la position dans le plan, en hauteurs d'écran.
 *   entrée du couloir → arrêt → trajet → arrêt → … → le bureau.
 * On peut remonter, sauter d'un arrêt à l'autre (timeline, « Plan suivant ») : rien ne se désynchronise.
 * Animations réduites ou économie de données : rien n'est monté, la page garde sa version empilée.
 */
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $, $$, clamp, listen, prefersReducedMotion, type Cleanup } from '../lib/dom';
import { smooth } from '../lib/smooth';
import { coverBox, quadMatrix, toMatrix3d, type Quad } from '../lib/homography';

type Format = '16x9' | '9x16';
interface Track {
  format: Format;
  width: number;
  height: number;
  frames: number;
  /** Image où la caméra arrive à chaque arrêt (nom de l'arrêt dans le rendu → index). */
  stops: Record<string, number>;
  /** Pour chaque écran du décor, image par image : ses coins (0 à 1), ou null s'il n'est pas entièrement visible. */
  screens: Record<string, (Quad | null)[]>;
}

interface Segment {
  kind: 'leg' | 'stop';
  /** L'arrêt (pour un trajet : celui vers lequel on marche). */
  stop: string;
  start: number;
  len: number;
  /** Images couvertes par le segment (posées quand le rendu est chargé). */
  f0: number;
  f1: number;
}

/** Longueurs du plan, en hauteurs d'écran de défilement. */
const HERO_LEN = 1.3;
const LEG_LEN = 0.9;
const STOP_LEN = 1.0;
const LAST_LEN = 1.2;
/** La fiche arrive un peu avant l'arrêt et s'en va un peu après (part du trajet). */
const CARD_EARLY = 0.16;
/** Une boucle commence à se charger quand on est à moins de cette distance de son trajet d'arrivée. */
const PRELOAD = 0.8;
/** L'écran du premier arrêt ne s'allume qu'à cette part du trajet d'entrée : le début de la marche reste léger. */
const HERO_SCREEN_FROM = 0.4;
/** Téléchargements et décodages menés en parallèle. */
const LOADERS = 4;
const DECODERS = 3;
/** Images gardées décodées autour de celle qu'on regarde : derrière, et devant (ordinateur / téléphone). */
const BEHIND = 4;
const AHEAD = 16;
const AHEAD_PHONE = 10;

/** Écran en largeur : le trajet 16:9 ; en hauteur (téléphone, tablette debout) : le trajet 9:16. */
const pickFormat = (): Format => (innerWidth / innerHeight > 0.9 ? '16x9' : '9x16');

/** Coins d'un écran entre deux images voisines (le fondu des images, appliqué aux vidéos posées dessus). */
const lerpQuad = (a: Quad, b: Quad, t: number): Quad =>
  a.map(([x, y], i) => [x + (b[i][0] - x) * t, y + (b[i][1] - y) * t]) as unknown as Quad;

export function initTake(): Cleanup {
  const root = $('[data-take]');
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
  // Sans createImageBitmap (navigateurs anciens), la page garde sa version empilée.
  if (!root || prefersReducedMotion() || saveData || typeof createImageBitmap !== 'function') return () => {};

  // Référence figée après la vérification : les fonctions déclarées plus bas en ont besoin (TypeScript).
  const take: HTMLElement = root;
  const base = root.dataset.plan ?? '/plan';
  const stage = $('[data-take-stage]', root)!;
  const canvas = $<HTMLCanvasElement>('[data-take-canvas]', root)!;
  const ctx = canvas.getContext('2d', { alpha: false });
  const progress = $('[data-take-progress]', root);
  const pauseBtn = $<HTMLButtonElement>('[data-take-pause]', root);
  const part = (name: string): HTMLElement | null => $(`[data-take-part="${name}"]`, root);
  const hero = { word: part('word'), script: part('script'), spec: part('spec'), hint: part('hint') };
  const stopEls = $$('[data-stop]', root);
  const order = stopEls.map((el) => ({ id: el.dataset.stop ?? '', mark: el.dataset.mark ?? '', el }));
  const screens = $$('[data-take-screen]', root).map((el) => ({
    el,
    id: el.dataset.takeScreen ?? '',
    stop: el.dataset.stopOf ?? '',
    w: Number(el.dataset.w) || 1600,
    h: Number(el.dataset.h) || 900,
    video: $<HTMLVideoElement>('video', el)!,
    on: false,
    key: '',
    /** La lecture a été refusée (format, navigateur) : on ne la redemande plus, l'affiche reste. */
    refused: false,
  }));
  const railLinks = $$('[data-take-rail] [data-take-goto]', root);
  if (!ctx || order.length === 0) return () => {};

  /* ── Le plan, segment par segment ───────────────────────── */
  const segments: Segment[] = [];
  let total = 0;
  const push = (kind: Segment['kind'], stop: string, len: number): void => {
    segments.push({ kind, stop, start: total, len, f0: 0, f1: 0 });
    total += len;
  };
  push('leg', order[0].id, HERO_LEN);
  order.forEach((s, i) => {
    const last = i === order.length - 1;
    push('stop', s.id, last ? LAST_LEN : STOP_LEN);
    if (!last) push('leg', order[i + 1].id, LEG_LEN);
  });
  const stopSeg = (id: string): Segment | undefined => segments.find((s) => s.kind === 'stop' && s.stop === id);
  /** Où se pose un arrêt quand on y saute : la fiche est déjà là, la caméra presque immobile. */
  const restOf = (id: string): number => {
    const s = stopSeg(id);
    return s ? s.start + s.len * 0.3 : 0;
  };
  const legInto = (id: string): Segment | undefined => segments.find((s) => s.kind === 'leg' && s.stop === id);

  const cleanups: Cleanup[] = [];
  let fmt = pickFormat();
  let track: Track | null = null;
  let vw = 0;
  let vh = 0;
  /** Pixels du canevas par pixel CSS : jamais plus que l'image source n'en a (le navigateur agrandit, sans coût). */
  let k = 1;
  let box = { x: 0, y: 0, w: 0, h: 0 };
  let u = 0;
  let raf = 0;
  let inView = true;
  let userPaused = false;
  let activeStop = '';
  let currentRail = -1;
  let disposed = false;

  /* Images du décor : fichiers téléchargés, images décodées, et ce qui est à l'écran. */
  let blobs: (Blob | null)[] = [];
  const requested = new Set<number>();
  const failed = new Set<number>();
  const bitmaps = new Map<number, ImageBitmap>();
  const decoding = new Set<number>();
  let loading = 0;
  let loadedCount = 0;
  /** Change à chaque nouveau trajet (format) : les réponses en retard de l'ancien sont ignorées. */
  let generation = 0;
  /** Image visée par le défilement (partie entière). */
  let cur = 0;
  /** Première image dessinée : le canevas peut remplacer l'image d'accueil. */
  let ready = false;
  let drawnKey = '';
  let shownA = -1;
  let shownB = -1;
  let shownT = 0;
  /** Images du trajet d'entrée : tant qu'elles ne sont pas là, les boucles vidéo attendent. */
  let firstLeg = Infinity;
  /** Le fondu ne sert qu'en mouvement : à l'arrêt, l'image affichée glisse vers l'image entière la plus proche. */
  let lastU = -1;
  let moving = false;
  let settleTimer = 0;
  let shownF = 0;

  root.style.setProperty('--take-len', String(total));
  root.classList.add('is-live');
  if (pauseBtn) pauseBtn.hidden = false;
  railLinks.forEach((a) => {
    const id = a.dataset.takeGoto ?? 'top';
    a.closest('li')?.style.setProperty('--at', ((id === 'top' ? 0 : restOf(id)) / total).toFixed(4));
  });

  /* ── Mesures ─────────────────────────────────────────────── */
  function measure(): void {
    vw = stage.clientWidth;
    vh = stage.clientHeight;
    if (track) {
      box = coverBox(track.width, track.height, vw, vh);
      // Écran moins large que l'image (4:3, 16:10) : l'œuvre reste entière à gauche, c'est le mur de la fiche qui sort du cadre.
      if (track.format === '16x9' && box.w > vw) box.x = Math.min(0, Math.max(vw - box.w, 0.03 * vw - 0.09 * box.w));
      k = Math.max(0.5, Math.min(devicePixelRatio || 1, track.width / box.w));
    }
    canvas.width = Math.round(vw * k);
    canvas.height = Math.round(vh * k);
    ctx!.imageSmoothingQuality = 'medium';
    drawnKey = '';
    screens.forEach((s) => (s.key = ''));
  }

  /** Les images couvertes par chaque segment, d'après les arrêts du rendu. */
  function mapFrames(t: Track): void {
    const lastMark = order[order.length - 1].mark;
    const drift = Math.max(0, t.frames - 1 - (t.stops[lastMark] ?? t.frames - 1));
    let prevEnd = 0;
    for (const s of segments) {
      const mark = order.find((o) => o.id === s.stop)?.mark ?? '';
      const arrive = t.stops[mark] ?? 0;
      if (s.kind === 'leg') {
        s.f0 = prevEnd;
        s.f1 = arrive;
      } else {
        s.f0 = arrive;
        s.f1 = Math.min(t.frames - 1, arrive + drift);
        prevEnd = s.f1;
      }
    }
    firstLeg = (t.stops[order[0].mark] ?? 0) + 1;
  }

  /* ── Où en est-on ? ──────────────────────────────────────── */
  function segmentAt(value: number): { seg: Segment; i: number; t: number } {
    for (let i = 0; i < segments.length; i++) {
      const s = segments[i];
      if (value < s.start + s.len) return { seg: s, i, t: clamp((value - s.start) / s.len) };
    }
    const i = segments.length - 1;
    return { seg: segments[i], i, t: 1 };
  }

  /** L'image du trajet à cette position (avec sa partie décimale : le fondu vers la suivante). */
  const frameAt = (value: number): number => {
    const { seg, t } = segmentAt(value);
    return seg.f0 + (seg.f1 - seg.f0) * t;
  };

  /* ── Téléchargement : d'abord ce qui est devant soi ───────── */
  function pickNext(): number {
    let best = -1;
    let bestCost = Infinity;
    for (let f = 0; f < blobs.length; f++) {
      if (blobs[f] || requested.has(f) || failed.has(f)) continue;
      // Devant compte simple, derrière compte triple : on marche surtout vers l'avant.
      const cost = f >= cur ? f - cur : (cur - f) * 3;
      if (cost < bestCost) {
        bestCost = cost;
        best = f;
      }
    }
    return best;
  }

  function pump(): void {
    if (!track || disposed) return;
    const gen = generation;
    const format = track.format;
    while (loading < LOADERS) {
      const f = pickNext();
      if (f < 0) break;
      requested.add(f);
      loading++;
      fetch(`${base}/${format}/${String(f).padStart(4, '0')}.webp`)
        .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
        .then((blob) => {
          if (gen !== generation) return;
          blobs[f] = blob;
          loadedCount++;
          decodeWindow();
          if (loadedCount === firstLeg) schedule();
        })
        .catch(() => {
          if (gen === generation) failed.add(f);
        })
        .finally(() => {
          if (gen !== generation) return;
          loading--;
          pump();
        });
    }
  }

  /* ── Décodage à l'avance, autour de l'image visée ─────────── */
  const ahead = (): number => (vw < 800 ? AHEAD_PHONE : AHEAD);

  /** Décodée directement à la taille où elle sera dessinée : le dessin n'est plus qu'une copie. */
  function decodeBlob(blob: Blob): Promise<ImageBitmap> {
    const w = Math.round(box.w * k);
    const h = Math.round(box.h * k);
    if (track && w > 0 && h > 0 && w < track.width) {
      return createImageBitmap(blob, { resizeWidth: w, resizeHeight: h, resizeQuality: 'high' }).catch(() =>
        createImageBitmap(blob),
      );
    }
    return createImageBitmap(blob);
  }

  function decodeWindow(): void {
    if (!track || disposed) return;
    const gen = generation;
    const last = blobs.length - 1;
    const want: number[] = [];
    for (let f = cur; f <= Math.min(last, cur + ahead()); f++) want.push(f);
    for (let f = cur - 1; f >= Math.max(0, cur - BEHIND); f--) want.push(f);
    for (const f of want) {
      if (decoding.size >= DECODERS) break;
      const blob = blobs[f];
      if (!blob || bitmaps.has(f) || decoding.has(f) || failed.has(f)) continue;
      decoding.add(f);
      decodeBlob(blob)
        .then((bmp) => {
          decoding.delete(f);
          if (gen !== generation || disposed) {
            bmp.close();
            return;
          }
          bitmaps.set(f, bmp);
          // La mémoire est rendue derrière soi et loin devant.
          for (const [g, old] of bitmaps) {
            if (g < cur - BEHIND - 2 || g > cur + ahead() + 2) {
              old.close();
              bitmaps.delete(g);
            }
          }
          if (Math.abs(f - cur) <= 4) schedule();
          decodeWindow();
        })
        .catch(() => {
          decoding.delete(f);
          failed.add(f);
        });
    }
  }

  /** Une image décodée près de i (jamais loin : mieux vaut garder l'image à l'écran que sauter en arrière). */
  function nearestBitmap(i: number): number {
    if (bitmaps.has(i)) return i;
    for (let d = 1; d <= 4; d++) {
      if (bitmaps.has(i - d)) return i - d;
      if (bitmaps.has(i + d)) return i + d;
    }
    return -1;
  }

  /** Dessine l'image f (et le fondu vers la suivante). Rien de décodé à côté : le canevas garde son image. */
  function drawFrame(f: number): void {
    const i = Math.floor(f);
    const a = nearestBitmap(i);
    if (a < 0) return;
    const j = i + 1;
    const frac = f - i;
    const b = a === i && frac > 0.02 && bitmaps.has(j) ? j : -1;
    const t = b >= 0 ? Math.round(frac * 50) / 50 : 0;
    const key = `${a}:${b}:${t}:${canvas.width}x${canvas.height}`;
    if (key === drawnKey) return;
    const x = box.x * k;
    const y = box.y * k;
    const w = box.w * k;
    const h = box.h * k;
    ctx!.globalAlpha = 1;
    ctx!.drawImage(bitmaps.get(a)!, x, y, w, h);
    if (b >= 0) {
      ctx!.globalAlpha = t;
      ctx!.drawImage(bitmaps.get(b)!, x, y, w, h);
      ctx!.globalAlpha = 1;
    }
    drawnKey = key;
    shownA = a;
    shownB = b;
    shownT = t;
    if (!ready) {
      // L'image d'accueil ne cède la place qu'à un canevas déjà dessiné : pas d'écran noir au démarrage.
      ready = true;
      take.classList.add('is-ready');
    }
  }

  /* ── Rendu : tout se déduit de u ─────────────────────────── */
  function schedule(): void {
    if (!raf) raf = requestAnimationFrame(render);
  }

  function setOpacity(el: HTMLElement | null, value: number): void {
    if (!el) return;
    el.style.opacity = value.toFixed(3);
    el.style.visibility = value <= 0.001 ? 'hidden' : '';
  }

  function render(): void {
    raf = 0;
    const { seg, i, t } = segmentAt(u);
    const prev = i > 0 ? segments[i - 1].stop : '';

    // 1. Le décor : l'image du trajet, fondue avec la suivante pendant la marche.
    if (track) {
      const f = seg.f0 + (seg.f1 - seg.f0) * t;
      const target = Math.floor(f);
      if (target !== cur) {
        cur = target;
        pump();
        decodeWindow();
      }
      if (u !== lastU) {
        lastU = u;
        moving = true;
        clearTimeout(settleTimer);
        settleTimer = window.setTimeout(() => {
          moving = false;
          schedule();
        }, 140);
      }
      let fd = f;
      if (!moving) {
        // À l'arrêt, deux images mêlées se verraient en double : on se pose en douceur sur la plus proche.
        const goal = Math.round(f);
        fd = Math.abs(goal - shownF) < 0.04 ? goal : shownF + (goal - shownF) * 0.35;
        if (fd !== goal) schedule();
      }
      shownF = fd;
      drawFrame(fd);
    }

    // 2. La fiche : celle de l'arrêt, un peu avant d'y être et un peu après en être reparti.
    let stop = '';
    if (seg.kind === 'stop') stop = seg.stop;
    else if (t > 1 - CARD_EARLY) stop = seg.stop;
    else if (t < CARD_EARLY && prev) stop = prev;
    if (stop !== activeStop) {
      order.forEach((o) => o.el.classList.toggle('is-active', o.id === stop));
      activeStop = stop;
      // Sur téléphone, le bouton pause se pose au-dessus de la fiche (sa hauteur, lue une fois par arrêt).
      const card = order.find((o) => o.id === stop)?.el.querySelector<HTMLElement>('.stop__card');
      take.classList.toggle('has-card', Boolean(card));
      if (card) take.style.setProperty('--card-h', `${card.offsetHeight}px`);
    }

    // 3. Les écrans : ceux de l'arrêt d'où l'on vient et de celui où l'on va, quand on les voit en entier.
    //    Au tout début de la marche, aucun : l'entrée reste légère.
    const near = new Set(seg.kind === 'stop' ? [seg.stop] : i === 0 && t < HERO_SCREEN_FROM ? [] : [seg.stop, prev]);
    const live = inView && !userPaused && document.visibilityState === 'visible';
    // Une seule vidéo démarre (ou commence à se charger) par image : après un saut, trois boucles qui partent
    // ensemble faisaient sauter une image.
    let busy = false;
    for (const s of screens) {
      let q: Quad | null = null;
      if (track && shownA >= 0 && near.has(s.stop)) {
        const qa = track.screens[s.id]?.[shownA] ?? null;
        const qb = shownB >= 0 ? (track.screens[s.id]?.[shownB] ?? null) : null;
        q = qa && qb ? lerpQuad(qa, qb, shownT) : qa;
      }
      if (q) {
        const key = `${shownA}:${shownB}:${shownT}:${vw}x${vh}`;
        if (key !== s.key) {
          const quad = q.map(([x, y]) => [box.x + x * box.w, box.y + y * box.h]) as unknown as Quad;
          s.el.style.transform = toMatrix3d(quadMatrix(s.w, s.h, quad));
          s.key = key;
        }
      }
      if (Boolean(q) !== s.on) {
        s.on = Boolean(q);
        s.el.classList.toggle('is-on', s.on);
      }
      // Chargée un peu avant d'arriver, une fois les images de l'entrée arrivées ; jouée seulement quand on la voit.
      const leg = legInto(s.stop);
      if (ready && loadedCount >= firstLeg && !s.video.src && s.video.dataset.src && leg && u >= leg.start - PRELOAD) {
        if (busy) schedule();
        else {
          s.video.src = s.video.dataset.src;
          s.video.preload = 'auto';
          busy = true;
        }
      }
      const play = live && s.on && Boolean(s.video.src) && !s.refused;
      if (play && s.video.paused) {
        if (busy) schedule();
        else {
          s.video.play().catch((err: unknown) => {
            // Une pause demandée pendant le démarrage n'est pas un refus ; le reste, si.
            if ((err as DOMException)?.name !== 'AbortError') s.refused = true;
          });
          busy = true;
        }
      } else if (!play && !s.video.paused) s.video.pause();
    }

    // 4. Le titre et la fiche technique quittent le cadre dès qu'on se met en marche.
    const d = i === 0 ? t : 1;
    if (hero.word) {
      hero.word.style.transform = `translate3d(${(-d * 30).toFixed(2)}vw,0,0)`;
      setOpacity(hero.word, 1 - clamp(d / 0.45));
    }
    if (hero.script) {
      hero.script.style.transform = `translate3d(${(-d * 14).toFixed(2)}vw,${(-d * 4).toFixed(2)}svh,0)`;
      setOpacity(hero.script, 1 - clamp(d / 0.32));
    }
    if (hero.spec) {
      hero.spec.style.transform = `translate3d(0,${(d * 24).toFixed(1)}px,0)`;
      setOpacity(hero.spec, 1 - clamp(d / 0.2));
    }
    setOpacity(hero.hint, 1 - clamp(d / 0.1));

    // 5. Timeline et progression.
    let rail = 0;
    railLinks.forEach((a, n) => {
      const id = a.dataset.takeGoto ?? 'top';
      const leg = legInto(id);
      const at = id === 'top' || !leg ? 0 : leg.start + leg.len * (1 - CARD_EARLY);
      if (u >= at) rail = n;
    });
    if (rail !== currentRail) {
      railLinks.forEach((a, n) => {
        a.classList.toggle('is-current', n === rail);
        if (n === rail) a.setAttribute('aria-current', 'step');
        else a.removeAttribute('aria-current');
      });
      currentRail = rail;
    }
    progress?.style.setProperty('--p', (u / total).toFixed(4));
  }

  /* ── Trajet (format) : chargement et remise à zéro ────────── */
  async function loadTrack(format: Format): Promise<void> {
    const res = await fetch(`${base}/${format}/corners.json`);
    if (!res.ok) throw new Error(`corners.json : ${res.status}`);
    const data = (await res.json()) as Track;
    if (disposed || format !== fmt) return;
    track = data;
    mapFrames(data);
    blobs = new Array(data.frames).fill(null);
    measure();
    cur = Math.floor(frameAt(u));
    pump();
    schedule();
  }

  function reset(): void {
    generation++;
    track = null;
    blobs = [];
    requested.clear();
    failed.clear();
    bitmaps.forEach((b) => b.close());
    bitmaps.clear();
    decoding.clear();
    loading = 0;
    loadedCount = 0;
    ready = false;
    drawnKey = '';
    shownA = -1;
    shownB = -1;
    take.classList.remove('is-ready');
  }

  /* ── Défilement ──────────────────────────────────────────── */
  const st = ScrollTrigger.create({
    trigger: root,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      u = self.progress * total;
      schedule();
    },
    onRefresh: (self) => {
      u = self.progress * total;
      schedule();
    },
  });

  const scrollYFor = (id: string): number => st.start + ((id === 'top' ? 0 : restOf(id)) / total) * (st.end - st.start);

  cleanups.push(
    listen(root, 'click', (e) => {
      const link = (e.target as Element).closest<HTMLElement>('[data-take-goto]');
      if (!link || !root.contains(link)) return;
      e.preventDefault();
      smooth.scrollTo(scrollYFor(link.dataset.takeGoto ?? 'top'));
    }),
    // Au clavier, la fiche qui reçoit le focus vient à l'écran.
    listen(root, 'focusin', (e) => {
      const el = (e.target as Element).closest<HTMLElement>('[data-stop]');
      if (el && !el.classList.contains('is-active')) {
        smooth.scrollTo(scrollYFor(el.dataset.stop ?? ''), { immediate: true });
      }
    }),
    listen(document, 'visibilitychange', schedule),
  );

  if (pauseBtn) {
    const label = $('[data-pause-label]', pauseBtn);
    cleanups.push(
      listen(pauseBtn, 'click', () => {
        userPaused = !userPaused;
        pauseBtn.setAttribute('aria-pressed', String(userPaused));
        if (label) label.textContent = userPaused ? 'Relancer les vidéos' : 'Arrêter les vidéos';
        schedule();
      }),
    );
  }

  const io = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    schedule();
  });
  io.observe(root);

  const ro = new ResizeObserver(() => {
    const next = pickFormat();
    if (next !== fmt) {
      fmt = next;
      reset();
      loadTrack(fmt).catch(() => undefined);
    }
    measure();
    schedule();
  });
  ro.observe(stage);

  measure();
  schedule();

  // Le trajet se charge tout de suite : l'image d'accueil est déjà demandée (le parseur passe avant ce script),
  // et attendre la fin du chargement de la page laissait le décor figé plusieurs secondes si l'on défilait tôt.
  loadTrack(fmt).catch(() => {
    // Pas de coins, pas de plan : retour à la version empilée.
    root.classList.remove('is-live', 'is-ready');
    st.kill();
    requestAnimationFrame(() => ScrollTrigger.refresh());
  });

  return () => {
    disposed = true;
    generation++;
    cancelAnimationFrame(raf);
    clearTimeout(settleTimer);
    st.kill();
    io.disconnect();
    ro.disconnect();
    cleanups.forEach((fn) => fn());
    screens.forEach((s) => s.video.pause());
    bitmaps.forEach((b) => b.close());
    bitmaps.clear();
  };
}
