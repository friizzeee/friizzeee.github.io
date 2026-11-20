/**
 * Portfolio : met en forme les contenus de src/data/portfolio.ts pour les composants.
 * Valeurs par défaut, durées, chapitres, pistes de « Mon travail », catégories utilisées, projets voisins.
 * Rien à modifier ici pour ajouter un projet. Ce fichier ne s'exécute qu'au build (jamais dans le navigateur).
 */
import type { ImageMetadata } from 'astro';
import { site } from '../../config/site';
import {
  behindTheEdit as behindInput,
  categories as categoryDefs,
  projects as projectInputs,
  workTypes as workTypeDefs,
} from '../../data/portfolio';
import type {
  Category,
  CategoryDef,
  Chapter,
  Project,
  ProjectInput,
  TrackId,
  Video,
  VideoChapter,
  VideoInput,
  WorkItem,
  WorkTypeDef,
} from './types';

export type * from './types';

/* ── Valeurs par défaut ─────────────────────────────────────── */

const DEFAULTS = {
  creator: 'Projet personnel',
  editType: 'Montage vidéo',
  category: 'autres',
  categoryLabel: 'Autres projets',
  playLabel: 'Lire la vidéo',
} as const;

/** Pistes de « Mon travail », de haut en bas comme dans une timeline. */
export const TRACK_NAMES: Record<TrackId, string> = {
  V3: 'Textes',
  V2: 'Habillage',
  V1: 'Montage',
  A1: 'Son',
  A2: 'Musique',
};

const TRACK_ORDER: TrackId[] = ['V3', 'V2', 'V1', 'A1', 'A2'];

const categories: Record<string, CategoryDef> = categoryDefs;
const workTypes: Record<string, WorkTypeDef> = workTypeDefs;

const warn = (message: string): void => console.warn(`\n[nether] ⚠️  ${message}\n`);

/* ── Petits outils ──────────────────────────────────────────── */

export const pad = (n: number): string => String(n).padStart(2, '0');

/** '6:27' → 387 secondes ('1:02:03' accepté). */
export const toSeconds = (value: string | undefined): number =>
  (value ?? '').split(':').reduce((total, part) => total * 60 + (Number(part) || 0), 0);

/** 1095 → '18:15'. */
export const toClock = (seconds: number): string => {
  const value = Math.max(0, Math.round(seconds));
  const h = Math.floor(value / 3600);
  const m = Math.floor((value % 3600) / 60);
  const s = pad(value % 60);
  return h > 0 ? `${h}:${pad(m)}:${s}` : `${m}:${s}`;
};

/** Extrait l'ID d'un lien YouTube (watch, youtu.be, live, shorts, embed) ou valide un ID seul. */
export function youtubeId(input: string | undefined): string | null {
  const value = (input ?? '').trim();
  if (!value) return null;
  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^(www|m|music)\./, '');
    let id: string | null = null;
    if (host === 'youtu.be') id = url.pathname.split('/')[1] ?? null;
    else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      id = url.searchParams.get('v') ?? url.pathname.match(/^\/(?:live|shorts|embed)\/([^/?]+)/)?.[1] ?? null;
    }
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

const escapeHtml = (text: string): string => text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** 'Marty, *le Best Of*' → 'Marty, le Best Of'. */
const plainTitle = (title: string): string => title.replace(/\*/g, '');

/** 'Marty, *le Best Of*' → 'Marty, <em class="serif">le Best Of</em>' (HTML échappé). */
const richTitle = (title: string): string => escapeHtml(title).replace(/\*(.+?)\*/g, '<em class="serif">$1</em>');

/** '2026-11' → « Novembre 2026 ». */
function formatDate(iso: string | undefined, slug: string): Project['date'] {
  if (!iso) return undefined;
  const match = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(iso.trim());
  if (!match) {
    warn(`Projet « ${slug} » : date « ${iso} » non reconnue (attendu : AAAA-MM ou AAAA-MM-JJ). Elle est masquée.`);
    return undefined;
  }
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3] ?? 1)));
  const label = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
  return { iso: iso.trim(), label: label.charAt(0).toUpperCase() + label.slice(1) };
}

/** Ajoute à chaque chapitre la part de la vidéo qu'il occupe. */
function withShares(chapters: Chapter[], total: number): VideoChapter[] {
  if (total <= 0) return [];
  const listed = chapters.filter((c) => c.seconds < total);
  return listed.map((c, n) => ({
    ...c,
    from: c.seconds / total,
    to: (listed[n + 1]?.seconds ?? total) / total,
  }));
}

/* ── Mise en forme ──────────────────────────────────────────── */

interface VideoContext {
  slug: string;
  title: string;
  poster?: ImageMetadata;
  count: number;
  credit: string;
}

function resolveVideo(input: VideoInput, i: number, ctx: VideoContext): Video {
  const where = `Projet « ${ctx.slug} », vidéo ${i + 1}`;
  const poster = input.poster ?? ctx.poster;
  const hasFile = Boolean(input.file && poster);
  if (input.file && !poster) warn(`${where} : « file » est renseigné sans miniature (« poster »).`);

  // Un fichier hébergé sur le site passe avant YouTube.
  const id = hasFile ? null : youtubeId(input.url);
  if (!hasFile && input.url?.trim() && !id) warn(`${where} : lien YouTube non reconnu (${input.url}).`);

  const kind: Video['kind'] = hasFile ? 'file' : id ? 'youtube' : 'none';
  const seconds = toSeconds(input.duration);
  if (kind === 'file' && input.chapters?.length && seconds === 0) {
    warn(`${where} : « chapters » demande aussi « duration ».`);
  }
  const part = ctx.count > 1 ? `Partie ${i + 1}` : undefined;

  return {
    index: pad(i + 1),
    anchor: `video-${ctx.slug}-${pad(i + 1)}`,
    title: input.title?.trim() || (part ? `${ctx.title}, ${part.toLowerCase()}` : ctx.title),
    description: input.description?.trim() ?? '',
    duration: input.duration,
    seconds,
    kind,
    src: hasFile ? (input.file ?? '') : (id ?? ''),
    fileLight: hasFile ? input.fileLight : undefined,
    preview: hasFile ? input.preview : undefined,
    poster,
    chapters: kind === 'file' ? withShares(input.chapters ?? [], seconds) : [],
    credits: [ctx.credit, input.credits].filter(Boolean).join(' · '),
    playLabel: input.playLabel?.trim() || (part ? `Lire la ${part.toLowerCase()}` : DEFAULTS.playLabel),
    excerpt: input.excerpt === true,
    part,
    ready: kind !== 'none',
  };
}

function resolveWork(input: ProjectInput, slug: string): WorkItem[] {
  return (input.work ?? []).flatMap((item) => {
    const def = item.type ? workTypes[item.type] : undefined;
    if (item.type && !def && !item.label) {
      warn(`Projet « ${slug} » : travail « ${item.type} » absent du catalogue workTypes (src/data/portfolio.ts).`);
    }
    const label = item.label?.trim() || def?.label;
    if (!label) return [];
    return [{ label, detail: item.detail?.trim() || undefined, track: item.track ?? def?.track ?? 'V1' }];
  });
}

function resolveCategories(input: ProjectInput, slug: string): Category[] {
  const ids = input.categories?.length ? input.categories : [DEFAULTS.category];
  return [...new Set(ids)].map((id) => {
    const def = categories[id];
    if (!def && id !== DEFAULTS.category) {
      warn(`Projet « ${slug} » : catégorie « ${id} » inconnue. Ajoutez-la dans categories (src/data/portfolio.ts).`);
    }
    return { id, label: def?.label ?? (id === DEFAULTS.category ? DEFAULTS.categoryLabel : id) };
  });
}

function resolveProject(input: ProjectInput): Project {
  const slug = input.slug.trim();
  const title = plainTitle(input.title);
  const creator = input.creator?.trim() || DEFAULTS.creator;
  const sources = input.videos ?? [];
  const poster = input.poster ?? sources[0]?.poster;

  // Crédit affiché sous le lecteur : qui a monté, pour qui.
  const credit = [`Montage : ${site.name}`, creator !== DEFAULTS.creator && `Créateur : ${creator}`]
    .filter(Boolean)
    .join(' · ');

  const videos = sources.map((video, i) => resolveVideo(video, i, { slug, title, poster, count: sources.length, credit }));
  const playable = videos.filter((v) => v.ready);

  // Durée totale : celle saisie, sinon la somme des vidéos entières (un extrait ne compte pas).
  const full = videos.filter((v) => !v.excerpt);
  const summed = full.length > 0 && full.every((v) => v.seconds > 0) ? toClock(full.reduce((t, v) => t + v.seconds, 0)) : undefined;
  const duration = input.duration?.trim() || summed;

  const work = resolveWork(input, slug);
  const description = input.description?.trim() ?? '';
  const context = (input.context ?? []).map((p) => p.trim()).filter(Boolean);

  return {
    slug,
    href: `/portfolio/${slug}`,
    title,
    titleHtml: richTitle(input.title),
    creator,
    subtitle: input.subtitle?.trim() || undefined,
    categories: resolveCategories(input, slug),
    editType: input.editType?.trim() || DEFAULTS.editType,
    description,
    context: context.length > 0 ? context : description ? [description] : [],
    date: formatDate(input.date, slug),
    duration,
    format: input.format ?? '16:9',
    platform: input.platform?.trim() || undefined,
    poster,
    preview: input.preview ?? playable.find((v) => v.preview)?.preview,
    videos,
    playable,
    work,
    tracks: TRACK_ORDER.map((id) => ({ id, name: TRACK_NAMES[id], items: work.filter((w) => w.track === id) })).filter(
      (track) => track.items.length > 0,
    ),
    facts: input.facts ?? [],
    compression: input.compression,
    outline: withShares(input.outline ?? [], toSeconds(duration)),
    frames: input.frames ?? [],
    beforeAfter: input.beforeAfter,
    tools: (input.tools ?? []).map((t) => t.trim()).filter(Boolean),
    process: input.process ?? [],
    featured: input.featured === true,
    heroLoop: input.heroLoop,
    group: `projet-${slug}`,
    ready: playable.length > 0 || Boolean(input.beforeAfter),
  };
}

/* ── Ce que les pages utilisent ─────────────────────────────── */

const all = projectInputs.map((input) => resolveProject(input));

const seen = new Set<string>();
for (const project of all) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.slug)) {
    warn(`Projet « ${project.slug} » : le slug doit être en minuscules, chiffres et tirets (il sert d'adresse).`);
  }
  if (seen.has(project.slug)) warn(`Deux projets portent le slug « ${project.slug} » : un seul sera accessible.`);
  seen.add(project.slug);
  if (!project.ready) {
    warn(`Projet « ${project.slug} » sans vidéo lisible : il n'apparaît pas en ligne. Complétez src/data/portfolio.ts.`);
  }
}

/** Projets en ligne : ceux qui ont quelque chose à montrer. */
export const liveProjects: Project[] = all.filter((p) => p.ready);

/** Projets affichés dans la galerie : en développement, ceux à compléter apparaissent aussi (signalés en jaune). */
export const galleryProjects: Project[] = import.meta.env.DEV ? all : liveProjects;

/** Sélection de la page d'accueil : les projets `featured`, sinon les deux premiers. */
export const featuredProjects: Project[] = liveProjects.some((p) => p.featured)
  ? liveProjects.filter((p) => p.featured)
  : liveProjects.slice(0, 2);

/** Projet dont la boucle tourne dans le moniteur de la page d'accueil. */
export const heroReel: Project | null = liveProjects.find((p) => p.heroLoop) ?? null;

/** « Behind the Edit » : prêt dès qu'une vidéo est renseignée. */
export const behind: Project & { teaser: string } = {
  ...resolveProject(behindInput),
  teaser: behindInput.teaser,
};

/** Toutes les pages /portfolio/<slug> à générer. */
export const projectPages: Project[] = [...liveProjects, ...(behind.ready ? [behind] : [])];

/** Catégories qui ont au moins un projet en ligne, dans l'ordre du fichier de données. */
export const usedCategories: (Category & { count: number })[] = [
  ...Object.keys(categories),
  ...(categories[DEFAULTS.category] ? [] : [DEFAULTS.category]),
]
  .map((id) => ({
    id,
    label: categories[id]?.label ?? DEFAULTS.categoryLabel,
    count: liveProjects.filter((p) => p.categories.some((c) => c.id === id)).length,
  }))
  .filter((c) => c.count > 0);

export const projectsIn = (categoryId: string): Project[] =>
  liveProjects.filter((p) => p.categories.some((c) => c.id === categoryId));

/** Adresse de la galerie filtrée sur une catégorie. */
export const categoryHref = (categoryId: string): string => `/portfolio?categorie=${encodeURIComponent(categoryId)}`;

/** Projets précédent et suivant (la liste boucle). */
export function neighbors(slug: string): { prev: Project | null; next: Project | null; position: number; total: number } {
  const total = liveProjects.length;
  const index = liveProjects.findIndex((p) => p.slug === slug);
  if (index < 0 || total < 2) return { prev: null, next: null, position: Math.max(index, 0) + 1, total };
  return {
    prev: liveProjects[(index - 1 + total) % total] ?? null,
    next: liveProjects[(index + 1) % total] ?? null,
    position: index + 1,
    total,
  };
}

/** Texte court sous le lecteur et sur les cartes : « Marty · Crypto & Trading · Best Of de lives ». */
export const metaLine = (project: Project): string =>
  [project.creator, project.categories[0]?.label, project.editType].filter(Boolean).join(' · ');

/* ── Miniatures ─────────────────────────────────────────────── */

export interface RemoteThumb {
  url: string;
  width: number;
  height: number;
}

const THUMBS: [string, number, number][] = [
  ['maxresdefault', 1280, 720],
  ['sddefault', 640, 480],
  ['hqdefault', 480, 360],
];

const lookups = new Map<string, Promise<{ title: string | null; thumb: RemoteThumb | null }>>();

/** Interroge YouTube une seule fois par vidéo, au build : existe-t-elle, quel est son titre, quelle miniature ? */
export function lookupYoutube(id: string): Promise<{ title: string | null; thumb: RemoteThumb | null }> {
  const cached = lookups.get(id);
  if (cached) return cached;
  const request = (async () => {
    let title: string | null = null;
    let thumb: RemoteThumb | null = null;
    try {
      const watch = encodeURIComponent(`https://www.youtube.com/watch?v=${id}`);
      const res = await fetch(`https://www.youtube.com/oembed?url=${watch}&format=json`, {
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) title = ((await res.json()) as { title?: string }).title ?? null;
      else warn(`Vidéo YouTube ${id} : réponse ${res.status}. Elle est peut-être privée, supprimée ou non intégrable.`);
      for (const [name, width, height] of THUMBS) {
        const url = `https://i.ytimg.com/vi/${id}/${name}.jpg`;
        const head = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(6000) });
        if (head.ok) {
          thumb = { url, width, height };
          break;
        }
      }
    } catch {
      /* hors ligne au moment du build : la miniature sera chargée par le navigateur */
    }
    return { title, thumb };
  })();
  lookups.set(id, request);
  return request;
}

/** D'où vient l'image d'une carte ou d'une vidéo. */
export type PosterSource =
  | { kind: 'local'; image: ImageMetadata }
  | { kind: 'remote'; thumb: RemoteThumb }
  /** Secours : miniature YouTube chargée par le navigateur. */
  | { kind: 'youtube'; id: string }
  | { kind: 'none' };

export async function posterOf(project: Project, video?: Video): Promise<PosterSource> {
  const local = video?.poster ?? project.poster;
  if (local) return { kind: 'local', image: local };
  const source = video ?? project.playable[0];
  if (source?.kind === 'youtube') {
    const info = await lookupYoutube(source.src);
    return info.thumb ? { kind: 'remote', thumb: info.thumb } : { kind: 'youtube', id: source.src };
  }
  return { kind: 'none' };
}
