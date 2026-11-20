/**
 * ─────────────────────────────────────────────────────────────
 *  PORTFOLIO : vos réalisations
 *
 *  Tout le portfolio se pilote d'ici : la galerie, les filtres, la page
 *  de chaque projet et la sélection de la page d'accueil sont générés
 *  à partir de ce fichier.
 *
 *  AJOUTER UN PROJET (détails et commandes ffmpeg dans le README) :
 *   1. Miniature dans  src/assets/portfolio/  puis import en haut de ce fichier
 *   2. Vidéo (et boucle d'aperçu, facultative) dans  public/videos/
 *   3. Copiez le bloc « NOUVEAU PROJET » dans `projects`, plus bas
 *
 *  L'ordre du tableau `projects` est l'ordre d'affichage.
 *  Seuls `slug` et `title` sont obligatoires : tout le reste a une valeur
 *  par défaut ou disparaît proprement de la page quand il est absent.
 * ─────────────────────────────────────────────────────────────
 */
import type { CategoryDef, ProjectInput, WorkTypeDef } from '../lib/portfolio/types';

import vrHook from '../assets/portfolio/victoire-royale-hook.jpg';
import vrStorm from '../assets/portfolio/victoire-royale-kill7.jpg';
import vrTop1 from '../assets/portfolio/victoire-royale-top1.jpg';
import vrFinale from '../assets/portfolio/victoire-royale-finale.jpg';
import martyPart1 from '../assets/portfolio/marty-best-of-v5-partie1.jpg';
import martyPart2 from '../assets/portfolio/marty-best-of-v5-partie2.jpg';
import martyPart3 from '../assets/portfolio/marty-best-of-v5-partie3.jpg';

/**
 * ── 1. CATÉGORIES ────────────────────────────────────────────
 * Une ligne = une catégorie. L'ordre est celui des filtres.
 * Un filtre n'apparaît que si au moins un projet en ligne porte la catégorie :
 * vous pouvez donc en préparer d'avance.
 * Pour en ajouter une :   'ma-cle': { label: 'Nom affiché' },
 */
export const categories = {
  'crypto-trading': { label: 'Crypto & Trading' },
  gaming: { label: 'Gaming' },
  'long-format': { label: 'YouTube long format' },
  'format-court': { label: 'Formats courts' },
  business: { label: 'Business & entrepreneuriat' },
  autres: { label: 'Autres projets' },
} as const satisfies Record<string, CategoryDef>;

export type CategoryId = keyof typeof categories;

/**
 * ── 2. TRAVAIL RÉALISÉ : le catalogue ────────────────────────
 * Les lignes que vous pouvez citer dans le champ `work` d'un projet.
 * Sur la page du projet, elles sont rangées par piste, comme dans une timeline :
 *   V3 textes · V2 habillage et effets · V1 montage de l'image · A1 son · A2 musique
 * Ne citez dans un projet que ce que vous avez réellement fait sur la vidéo.
 * Un travail qui n'est pas dans le catalogue ? Ajoutez une ligne ici, ou écrivez-le
 * directement dans le projet :   { label: 'Mon libellé', track: 'V2', detail: '…' }
 */
export const workTypes = {
  selection: { label: 'Sélection des meilleurs moments', track: 'V1' },
  nettoyage: { label: 'Suppression des passages inutiles', track: 'V1' },
  rythme: { label: 'Rythme et coupes', track: 'V1' },
  structure: { label: 'Structure et narration', track: 'V1' },
  transitions: { label: 'Transitions', track: 'V1' },
  zooms: { label: 'Zooms et mouvements de caméra', track: 'V1' },
  effets: { label: 'Effets visuels', track: 'V2' },
  habillage: { label: 'Habillage graphique', track: 'V2' },
  etalonnage: { label: 'Étalonnage', track: 'V2' },
  sousTitres: { label: 'Sous-titres', track: 'V3' },
  textes: { label: 'Textes à l’écran', track: 'V3' },
  soundDesign: { label: 'Sound design', track: 'A1' },
  musique: { label: 'Musique et mixage', track: 'A2' },
} as const satisfies Record<string, WorkTypeDef>;

export type WorkTypeId = keyof typeof workTypes;

type ProjectEntry = ProjectInput<CategoryId, WorkTypeId>;

/**
 * ── 3. PROJETS ───────────────────────────────────────────────
 */
export const projects: ProjectEntry[] = [
  {
    slug: 'marty-best-of',
    title: 'Marty, *le Best Of*',
    creator: 'Marty',
    categories: ['crypto-trading', 'long-format'],
    editType: 'Best Of de lives',
    platform: 'YouTube',
    /* Durée du Best Of complet (les trois fichiers ajoutent chacun un carton « À suivre »). */
    duration: '18:15',
    description:
      'Quatre lives de crypto et de trading condensés en un Best Of de 18 minutes, découpé en trois parties.',
    context: [
      'Marty parle de cryptomonnaies, de trading et de finance en direct. J’ai repris quatre de ses lives pour en tirer un Best Of en trois parties : les moments forts, des coupes posées sur les silences de sa voix, des sous-titres qui suivent ses phrases, et des logos et schémas qui arrivent au moment où il en parle.',
      'Le découpage suit le récit, pas le chronomètre : chaque partie s’arrête là où l’histoire change. Montage réalisé entièrement par mes soins.',
    ],
    poster: martyPart1,
    featured: true,
    /* Chiffres du compte rendu de la version finale (V5). */
    facts: [
      { value: '4', label: 'lives condensés' },
      { value: '18:15', label: 'en trois parties' },
      { value: '248', label: 'plans et cartons' },
      { value: '38', label: 'pop-ups animés' },
    ],
    work: [
      {
        type: 'selection',
        detail: 'Quatre lives passés en revue pour ne garder que les moments forts : 18 min 15, en trois parties.',
      },
      {
        type: 'nettoyage',
        detail: 'Les longueurs, les apartés et les mini-plans sans parole utile sont retirés.',
      },
      {
        type: 'rythme',
        detail: 'Chaque coupe est calée sur un silence de la voix, avec un peu d’air avant et après, pour que les phrases restent entières.',
      },
      { type: 'zooms', detail: 'Un cadrage par plan, entre plein écran et zoom.' },
      {
        type: 'habillage',
        detail: '38 pop-ups animés : les logos des entreprises citées et de petits schémas pour suivre les explications. Un carton ouvre chaque chapitre.',
      },
      {
        type: 'sousTitres',
        detail: '139 phrases affichées une par une, au rythme de la voix. Texte blanc, sans bandeau.',
      },
      { type: 'soundDesign', detail: '45 effets sonores, placés sur l’action.' },
      {
        type: 'musique',
        detail: 'Un morceau par chapitre, gardé bien en dessous de la voix. Mix final à −14 LUFS, la norme YouTube.',
      },
    ],
    videos: [
      {
        file: '/videos/marty-best-of-v5-partie1.mp4',
        fileLight: '/videos/marty-best-of-v5-partie1-480p.mp4',
        preview: '/videos/marty-best-of-v5-partie1-preview.mp4',
        poster: martyPart1,
        title: 'Marty, le Best Of — partie 1',
        duration: '6:27',
        description:
          'Le hack de Binance et la chasse aux liquidations, graphiques à l’appui. La partie se termine sur le bêtisier du live.',
        chapters: [
          { time: '0:00', seconds: 0, label: 'Accroche' },
          { time: '0:28', seconds: 28, label: 'Le hack de Binance' },
          { time: '2:57', seconds: 177, label: 'Chasser la liquidité' },
          { time: '5:08', seconds: 308, label: 'Live sans filet' },
        ],
        credits:
          'Musiques : « Presenterator », « Funky Chunk », « Funkorama » — Kevin MacLeod (incompetech.com), licence CC BY 4.0.',
      },
      {
        file: '/videos/marty-best-of-v5-partie2.mp4',
        fileLight: '/videos/marty-best-of-v5-partie2-480p.mp4',
        preview: '/videos/marty-best-of-v5-partie2-preview.mp4',
        poster: martyPart2,
        title: 'Marty, le Best Of — partie 2',
        duration: '5:10',
        description:
          'Ce qui se passe dans la tête d’un trader, puis le 4 novembre à 15h48 : le all-in, jusqu’au « go dodo ».',
        chapters: [
          { time: '0:00', seconds: 0, label: 'Trader, c’est dans la tête' },
          { time: '2:28', seconds: 148, label: '4 novembre, 15h48' },
        ],
        credits:
          'Musiques : « Overcast », « Nonstop », « Motivator » — Kevin MacLeod (incompetech.com), licence CC BY 4.0.',
      },
      {
        file: '/videos/marty-best-of-v5-partie3.mp4',
        fileLight: '/videos/marty-best-of-v5-partie3-480p.mp4',
        preview: '/videos/marty-best-of-v5-partie3-preview.mp4',
        poster: martyPart3,
        title: 'Marty, le Best Of — partie 3',
        duration: '6:42',
        description:
          'La fin du 4 novembre, le crash de la finance traditionnelle quatre jours plus tard, et ce que Marty en retient pour la suite.',
        chapters: [
          { time: '0:00', seconds: 0, label: '4 novembre, la suite' },
          { time: '1:50', seconds: 110, label: 'Le crash TradFi' },
          { time: '5:04', seconds: 304, label: 'Et maintenant ?' },
        ],
        credits:
          'Musiques : « Motivator », « Son of a Rocket », « Enter the Party » — Kevin MacLeod (incompetech.com), licence CC BY 4.0.',
      },
    ],
  },

  {
    slug: 'victoire-royale',
    title: 'Victoire Royale *couronnée*',
    creator: 'Projet personnel',
    subtitle: 'Fortnite · Recharge classé, solo',
    categories: ['gaming', 'long-format'],
    editType: 'Montage gaming narratif',
    platform: 'YouTube',
    duration: '5:40',
    description:
      'Une partie de 13 minutes, sans commentaire, transformée en une histoire de 5 min 40 : une accroche, des actes, un retournement et une fin.',
    context: [
      'Une partie complète de 13 minutes, sans commentaire, transformée en une histoire de 5 min 40 : une accroche, des actes, un retournement et une fin. Sans voix off, ce sont les textes, la musique et le sound design qui racontent.',
    ],
    poster: vrHook,
    preview: '/videos/victoire-royale-preview.mp4',
    /* Boucle du moniteur de la page d'accueil (voir « Moniteur de la page d'accueil » dans le README). */
    heroLoop: '/videos/victoire-royale-hero.mp4',
    featured: true,
    facts: [
      { value: '68', label: 'plans montés' },
      { value: '8', label: 'chapitres' },
      { value: '120 i/s', label: 'ralentis natifs' },
      { value: '−14 LUFS', label: 'mix, norme YouTube' },
    ],
    compression: { raw: '13:23', final: '5:40', rawSeconds: 803, finalSeconds: 340 },
    /* Structure de la vidéo finale (l'extrait hébergé ne montre que le final). */
    outline: [
      { time: '0:00', seconds: 0, label: 'Intro' },
      { time: '0:06', seconds: 6, label: 'Le drop' },
      { time: '0:29', seconds: 29, label: 'Premier fight' },
      { time: '1:33', seconds: 93, label: 'Direction la zone' },
      { time: '2:07', seconds: 127, label: 'Snobby Shoals' },
      { time: '3:13', seconds: 193, label: 'Top 10' },
      { time: '4:59', seconds: 299, label: '1 contre 1' },
      { time: '5:30', seconds: 330, label: 'Victoire royale' },
    ],
    frames: [
      { image: vrHook, time: '0:02', label: 'L’accroche' },
      { image: vrStorm, time: '3:47', label: 'Dans la tempête' },
      { image: vrTop1, time: '5:31', label: 'Le top 1' },
    ],
    work: [
      {
        type: 'structure',
        detail: 'Une accroche sur le dernier duel, un retour en arrière, puis huit chapitres jusqu’à la victoire.',
      },
      {
        type: 'nettoyage',
        detail: 'L’attente, les menus et les trajets sans enjeu sont coupés ; le loot et les déplacements sont accélérés.',
      },
      { type: 'rythme', detail: 'Les combats restent en temps réel ; des jump cuts relancent les plans longs.' },
      {
        type: 'zooms',
        detail: 'Un zoom sur chaque élimination, calé sur l’image du kill, et deux vrais ralentis grâce aux 120 images par seconde de la source.',
      },
      { type: 'transitions', detail: 'Coupes franches par défaut ; dix transitions réservées aux changements d’acte.' },
      { type: 'effets', detail: 'Arrêt sur image en noir et blanc, puis retour en arrière, pour l’accroche.' },
      { type: 'etalonnage', detail: 'Un réglage global du contraste, de la netteté et de la vibrance.' },
      {
        type: 'textes',
        detail: 'Titres d’acte, compteur d’éliminations et carte de fin, placés hors de l’interface du jeu.',
      },
      {
        type: 'soundDesign',
        detail: 'Des effets créés pour le montage : impacts, whoosh, montée avant le dernier duel.',
      },
      { type: 'musique', detail: 'Quatre morceaux dont le niveau suit l’action. Mix final à −14 LUFS.' },
    ],
    videos: [
      {
        file: '/videos/victoire-royale-finale.mp4',
        poster: vrFinale,
        title: 'Victoire Royale couronnée',
        duration: '0:41',
        excerpt: true,
        playLabel: 'Voir le final · 0:41',
        credits:
          'Musiques : « Bit Shift », « Volatile Reaction », « Run Amok », « Fluffing a Duck » — Kevin MacLeod (incompetech.com), licence CC BY 4.0.',
      },
    ],
  },

  /* ── NOUVEAU PROJET : copiez ce bloc, décommentez-le et remplissez-le ──
  {
    slug: 'ma-video',                       // adresse de la page : /portfolio/ma-video
    title: 'Titre de la vidéo',
    creator: 'Nom du créateur ou du client',
    categories: ['gaming'],                 // une ou plusieurs clés de `categories` (la première = principale)
    editType: 'Montage YouTube',            // type de montage
    description: 'Une ou deux phrases sur le contexte de la vidéo.',
    poster: maMiniature,                    // import maMiniature from '../assets/portfolio/ma-miniature.jpg';
    duration: '12:30',
    date: '2026-12',                        // date de publication (facultatif)
    videos: [
      { file: '/videos/ma-video.mp4', preview: '/videos/ma-video-preview.mp4' },
      // ou une vidéo YouTube publique :  { url: 'https://www.youtube.com/watch?v=XXXXXXXXXXX' }
    ],
    work: [                                 // uniquement ce que vous avez fait sur cette vidéo
      { type: 'selection', detail: 'Ce que vous avez fait, en une phrase.' },
      { type: 'sousTitres' },
    ],
    // featured: true,                      // pour l'afficher aussi sur la page d'accueil
  },
  ── */
];

/**
 * ── 4. BEHIND THE EDIT ───────────────────────────────────────
 * L'emplacement réservé à la vidéo qui montrera les coulisses du montage.
 * Tant que `videos` est vide, la page Portfolio affiche un emplacement « en préparation »
 * avec la phrase `teaser`, et rien d'autre : aucun faux contenu.
 *
 * Le jour où la vidéo est prête, remplissez les champs ci-dessous (ce sont les mêmes que
 * pour un projet) : l'emplacement devient une vraie présentation et la page
 * /portfolio/behind-the-edit est créée automatiquement.
 */
export const behindTheEdit: ProjectEntry & { teaser: string } = {
  slug: 'behind-the-edit',
  title: 'Behind *the Edit*',
  editType: 'Coulisses du montage',
  teaser: 'Une vidéo est en préparation : les coulisses d’un montage, de l’analyse des rushs à la livraison.',

  // poster: maMiniature,                          ← la miniature
  // description: '…',                             ← la description
  // duration: '8:00',
  videos: [
    // { file: '/videos/behind-the-edit.mp4', preview: '/videos/behind-the-edit-preview.mp4' },   ← la vidéo
  ],
  tools: [
    // 'Nom de l’outil',                           ← les outils utilisés
  ],
  process: [
    // { title: 'Nom de l’étape', text: 'Ce qu’on voit dans la vidéo à ce moment-là.' },          ← les étapes
  ],
};

/**
 * ── 5. EMPLACEMENTS « À VENIR » ──────────────────────────────
 * Affichés sous la galerie tant qu'elle compte moins de 6 projets.
 * Supprimez une ligne dès qu'un vrai projet du même type est en ligne,
 * ou videz le tableau pour tout masquer.
 */
export const upcomingSlots: { format: '16:9' | '9:16'; label: string }[] = [
  { format: '16:9', label: 'Long format · YouTube' },
  { format: '9:16', label: 'TikTok' },
  { format: '9:16', label: 'Reels Instagram' },
];
