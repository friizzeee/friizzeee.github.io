/**
 * Types du portfolio.
 *  - Les contenus (ce que vous modifiez) : src/data/portfolio.ts
 *  - La mise en forme (valeurs par défaut, calculs) : ./index.ts
 * Les `…Input` décrivent ce qu'on saisit ; les types sans suffixe, ce que les composants reçoivent.
 */
import type { ImageMetadata } from 'astro';

/** Piste de la timeline à laquelle un travail se rattache (de haut en bas dans un logiciel de montage). */
export type TrackId = 'V3' | 'V2' | 'V1' | 'A1' | 'A2';

export interface CategoryDef {
  /** Nom affiché sur les filtres, les cartes et les pages projet. */
  label: string;
}

export interface WorkTypeDef {
  /** Nom du travail, tel qu'il s'affiche dans « Mon travail ». */
  label: string;
  /** Piste concernée : V1 image · V2 habillage · V3 textes · A1 son · A2 musique. */
  track: TrackId;
}

/** Un chapitre : `time` est le texte affiché, `seconds` le même instant en secondes (2:57 → 177). */
export interface Chapter {
  time: string;
  seconds: number;
  label: string;
}

export interface Fact {
  value: string;
  label: string;
}

/** Durée du rush comparée à la durée finale. */
export interface Compression {
  raw: string;
  final: string;
  rawSeconds: number;
  finalSeconds: number;
}

export interface Frame {
  image: ImageMetadata;
  time: string;
  label: string;
}

export interface BeforeAfter {
  before: ImageMetadata;
  after: ImageMetadata;
  beforeLabel?: string;
  afterLabel?: string;
}

export interface ProcessStep {
  title: string;
  text: string;
}

/* ── Ce qu'on saisit ─────────────────────────────────────────── */

export interface VideoInput {
  /** Fichier vidéo dans public/ (ex. '/videos/ma-video.mp4'). Passe avant `url`. */
  file?: string;
  /** Version allégée (480p) : choisie d'office sur téléphone et connexion lente. */
  fileLight?: string;
  /** Courte boucle muette jouée au survol (chargée seulement à ce moment-là). */
  preview?: string;
  /** Miniature (image dans src/assets/portfolio/). Par défaut : celle du projet. */
  poster?: ImageMetadata;
  /** Lien YouTube (ou ID) d'une vidéo publique. */
  url?: string;
  /** Par défaut : le titre du projet, ou « Partie 1, 2… » s'il y a plusieurs vidéos. */
  title?: string;
  description?: string;
  /** Durée, ex. '6:27'. Nécessaire pour dessiner les chapitres. */
  duration?: string;
  /** Chapitres cliquables : la lecture démarre à cet instant (fichier hébergé uniquement). */
  chapters?: Chapter[];
  /** Crédits affichés sous le lecteur (musiques sous licence, etc.). */
  credits?: string;
  /** Texte du bouton de lecture. Par défaut : « Lire la vidéo ». */
  playLabel?: string;
  /** true : c'est un extrait, pas la vidéo entière (sa durée n'entre pas dans le total du projet). */
  excerpt?: boolean;
}

/** Une ligne de « Mon travail » : un type du catalogue, ou un libellé libre. */
export interface WorkInput<W extends string = string> {
  /** Clé du catalogue `workTypes` (ex. 'selection'). */
  type?: W;
  /** Libellé libre, à la place de `type` (ou pour le remplacer). */
  label?: string;
  /** Piste, pour un libellé libre. Par défaut : V1. */
  track?: TrackId;
  /** Ce que vous avez fait concrètement sur cette vidéo (une phrase). */
  detail?: string;
}

export interface ProjectInput<C extends string = string, W extends string = string> {
  /** Identifiant dans l'adresse : /portfolio/<slug>. Minuscules et tirets, unique. */
  slug: string;
  /** Titre. Entourez un passage d'astérisques pour le passer en italique : 'Marty, *le Best Of*'. */
  title: string;
  /** Créateur ou client. Par défaut : « Projet personnel ». */
  creator?: string;
  /** Ligne secondaire (jeu, thème, série…). */
  subtitle?: string;
  /** Catégories (clés de `categories`). La première est la catégorie principale. */
  categories?: C[];
  /** Type de montage, ex. 'Best Of de lives'. Par défaut : « Montage vidéo ». */
  editType?: string;
  /** Une ou deux phrases : affichées sur la carte et en tête de la page projet. */
  description?: string;
  /** Contexte détaillé, un paragraphe par entrée. Par défaut : la description. */
  context?: string[];
  /** Date de publication : 'AAAA-MM' ou 'AAAA-MM-JJ'. Masquée si absente. */
  date?: string;
  /** Durée totale, ex. '18:15'. Par défaut : la somme des vidéos. */
  duration?: string;
  /** Par défaut : '16:9'. */
  format?: '16:9' | '9:16';
  /** YouTube, TikTok, Instagram… */
  platform?: string;
  /** Miniature (image dans src/assets/portfolio/). Par défaut : celle de la première vidéo. */
  poster?: ImageMetadata;
  /** Boucle muette de la carte. Par défaut : celle de la première vidéo. */
  preview?: string;
  /** La ou les vidéos (plusieurs = un projet en plusieurs parties). */
  videos?: VideoInput[];
  /** « Mon travail » : uniquement ce qui a réellement été fait sur cette vidéo. */
  work?: WorkInput<W>[];
  /** Chiffres du montage (facultatif). */
  facts?: Fact[];
  compression?: Compression;
  /** Structure de la vidéo finale, quand elle n'est pas hébergée en entier (chapitres non cliquables). */
  outline?: Chapter[];
  /** Images clés du montage. */
  frames?: Frame[];
  /** Comparateur avant / après : seulement si vous avez les deux images. */
  beforeAfter?: BeforeAfter;
  /** Outils utilisés (facultatif). */
  tools?: string[];
  /** Étapes du processus, pour un projet « coulisses » (facultatif). */
  process?: ProcessStep[];
  /** true : mis en avant sur la page d'accueil. */
  featured?: boolean;
  /** Boucle du moniteur de la page d'accueil (un seul projet). Voir le README. */
  heroLoop?: string;
}

/* ── Ce que les composants reçoivent ─────────────────────────── */

export interface VideoChapter extends Chapter {
  /** Début et fin, en part de la vidéo (0 à 1). */
  from: number;
  to: number;
}

export interface Video {
  /** '01', '02'… */
  index: string;
  /** id HTML du bouton de lecture (cible des chapitres). */
  anchor: string;
  title: string;
  description: string;
  duration?: string;
  seconds: number;
  kind: 'file' | 'youtube' | 'none';
  /** Chemin du fichier, ou ID YouTube. */
  src: string;
  fileLight?: string;
  preview?: string;
  poster?: ImageMetadata;
  chapters: VideoChapter[];
  credits: string;
  playLabel: string;
  excerpt: boolean;
  /** « Partie 1 », dans un projet en plusieurs parties. */
  part?: string;
  ready: boolean;
}

export interface WorkItem {
  label: string;
  detail?: string;
  track: TrackId;
}

export interface WorkTrack {
  id: TrackId;
  name: string;
  items: WorkItem[];
}

export interface Category {
  id: string;
  label: string;
}

export interface Project {
  slug: string;
  href: string;
  /** Titre sans mise en forme (balises, lecteurs d'écran). */
  title: string;
  /** Titre en HTML : l'italique devient <em class="serif">. */
  titleHtml: string;
  creator: string;
  subtitle?: string;
  categories: Category[];
  editType: string;
  description: string;
  context: string[];
  date?: { iso: string; label: string };
  duration?: string;
  format: '16:9' | '9:16';
  platform?: string;
  poster?: ImageMetadata;
  preview?: string;
  videos: Video[];
  /** Vidéos réellement lisibles. */
  playable: Video[];
  work: WorkItem[];
  /** Le même travail, rangé par piste (V3 en haut, A2 en bas). */
  tracks: WorkTrack[];
  facts: Fact[];
  compression?: Compression;
  outline: VideoChapter[];
  frames: Frame[];
  beforeAfter?: BeforeAfter;
  tools: string[];
  process: ProcessStep[];
  featured: boolean;
  heroLoop?: string;
  /** Identifiant commun aux vidéos : le lecteur s'en sert pour enchaîner les parties. */
  group: string;
  /** false : ni vidéo lisible ni avant/après. Masqué en ligne, signalé en développement. */
  ready: boolean;
}
