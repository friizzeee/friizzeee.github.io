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
import shortNvidia from '../assets/portfolio/marty-short-nvidia.jpg';
import short55k from '../assets/portfolio/marty-short-55k.jpg';
import goldenPart1 from '../assets/portfolio/golden-boy-best-of-partie1.jpg';
import goldenPart2 from '../assets/portfolio/golden-boy-best-of-partie2.jpg';
import goldenReconnait from '../assets/portfolio/golden-boy-short-reconnait.jpg';
import goldenChat from '../assets/portfolio/golden-boy-short-chat.jpg';
import goldenVoiture from '../assets/portfolio/golden-boy-short-voiture.jpg';
import { coulisses } from './coulisses';

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
  divertissement: { label: 'Divertissement & clashs' },
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
        fileLight: '/videos/victoire-royale-finale-720p.mp4',
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

  {
    slug: 'marty-shorts',
    title: 'Marty, *en 9:16*',
    creator: 'Marty',
    subtitle: 'Extraits de « BITCOIN : le bottom du bear market à 55 000 $ ? »',
    categories: ['format-court', 'crypto-trading'],
    editType: 'Extraits verticaux',
    platform: 'TikTok, Reels, Shorts',
    format: '9:16',
    date: '2026-11',
    description:
      'Une analyse de 10 min 37 sur Bitcoin. Deux extraits verticaux de 38 et 30 secondes, qui se comprennent sans avoir vu la vidéo.',
    context: [
      'Marty publie des analyses de Bitcoin montées : le graphique en plein écran, sa webcam dans un coin. J’ai cherché dans sa vidéo de 10 min 37 les passages qui tiennent seuls : un nom connu, un chiffre, une chute.',
      'Le premier extrait garde un seul passage, de bout en bout. Le second remet trois passages de la vidéo dans l’ordre d’une histoire : la question, la menace, le plan, l’espoir. Il s’arrête sur « jackpot », juste avant une phrase qui aurait sonné comme un conseil financier.',
    ],
    poster: shortNvidia,
    /* Chiffres du dossier de montage (video_bottom_55k/LISEZMOI.md et CHOIX_DES_EXTRAITS.md). */
    facts: [
      { value: '10:37', label: 'd’analyse en source' },
      { value: '2', label: 'extraits verticaux' },
      { value: '38 s · 30 s', label: 'durée des extraits' },
      { value: '1', label: 'pop-up par extrait' },
    ],
    work: [
      {
        type: 'selection',
        detail: 'Chaque passage noté sur une grille (accroche, compris sans contexte, émotion, chiffre, chute) : les deux meilleurs sont montés, trois autres restent en réserve.',
      },
      { type: 'structure', detail: 'Extrait 2 : trois passages remis dans l’ordre d’une histoire, toujours en phrases entières.' },
      { type: 'zooms', detail: 'La webcam suit les zooms que Marty fait dans sa vidéo ; un zoom lent sur son visage pour la phrase finale.' },
      { type: 'habillage', detail: 'Un seul pop-up par extrait : le logo Nvidia puis « +30 % », et « 54 000 $ ou 46 000 $ ? ».' },
      { type: 'sousTitres', detail: 'Deux séries de sous-titres par extrait : sur l’accroche et sur la chute.' },
      {
        type: 'musique',
        detail: 'Un beat par extrait, coupé juste avant les phrases clés. Mix mesuré à −14,6 et −14,9 LUFS, la voix environ 17 dB au-dessus de la musique.',
      },
    ],
    videos: [
      {
        file: '/videos/marty-short-nvidia.mp4',
        preview: '/videos/plan-short-nvidia.mp4',
        poster: shortNvidia,
        title: 'Nvidia fait +30 %… et Bitcoin ne bouge pas',
        duration: '0:38',
        description: 'Un paradoxe qu’on comprend sans rien savoir de la vidéo, et une chute : « le plus important, c’est l’analyse technique ».',
        credits: 'Musique : « Old School Hip Hop Beat - De Boom Bap Callejero » (Pixabay).',
      },
      {
        file: '/videos/marty-short-55k.mp4',
        preview: '/videos/plan-short-55k.mp4',
        poster: short55k,
        title: '55 000 $ : le bottom ou un plus gros crash ?',
        duration: '0:30',
        description: 'La question, la menace, le plan, l’espoir : trois passages remis en ordre, jusqu’à « jackpot ».',
        credits: 'Musique : « Hip Hop Instrumental » (Pixabay).',
      },
    ],
  },

  {
    slug: 'golden-boy-best-of',
    title: 'Golden Boy, *le Best Of*',
    creator: 'Golden Boy',
    subtitle: 'Live du 24 novembre 2026 · OmeTV',
    categories: ['divertissement', 'long-format'],
    editType: 'Best Of de live',
    platform: 'YouTube',
    date: '2026-11',
    duration: '14:43',
    description:
      'Une session OmeTV d’1 h 33, en plein live, condensée en un Best Of de 14 min 43 qui garde le style de sa chaîne.',
    context: [
      'Golden Boy fait des micro-trottoirs de confrontation, et des lives. Le 24 novembre, il passe 1 h 33 sur OmeTV à discuter avec des inconnus tirés au hasard. J’en ai tiré un Best Of de 14 min 43 en reprenant la grammaire de ses propres vidéos de lives : l’écran du live tel quel, des coupes sèches, quelques gros plans, ni chapitre ni carton.',
      'Le montage suit l’ordre du live, sauf l’accroche. Aucun mineur à l’image : quand un inconnu douteux passe dans la fenêtre, le plan est recadré sur Golden Boy seul. Sur le site, la vidéo est hébergée en deux parties.',
    ],
    poster: goldenPart1,
    featured: true,
    /* Chiffres du compte rendu du montage (GOLDENBOY_BEST_OF_LIVE_24NOV/COMPTE_RENDU.md, version V3). */
    facts: [
      { value: '1 h 33', label: 'de session OmeTV' },
      { value: '14:43', label: 'de Best Of' },
      { value: '76', label: 'coupes, toutes dans un silence' },
      { value: '22', label: 'zooms sur les répliques' },
    ],
    work: [
      { type: 'selection', detail: 'Les meilleurs échanges d’une session d’1 h 33, dans l’ordre du live, avec l’accroche en tête.' },
      { type: 'nettoyage', detail: 'Les blancs et les passages trop risqués pour YouTube sont retirés ; aucun mineur à l’image.' },
      { type: 'rythme', detail: '76 coupes sèches, chacune posée dans un silence mesuré : les phrases restent entières.' },
      { type: 'zooms', detail: '22 zooms rapides vers le visage au moment d’une réplique, puis retour sec au plan large.' },
      {
        type: 'sousTitres',
        detail: '15 répliques sous-titrées, en blanc et en majuscules, au plus quatre mots à la fois, au fil de la parole.',
      },
      {
        type: 'musique',
        detail: 'Sur les clashs seulement : le morceau entre sur son drop juste après la réplique, joue fort sur la réaction, puis s’arrête avant la chute suivante. Mix à −14,4 LUFS.',
      },
    ],
    videos: [
      {
        file: '/videos/golden-boy-best-of-partie1.mp4',
        fileLight: '/videos/golden-boy-best-of-partie1-480p.mp4',
        preview: '/videos/golden-boy-best-of-partie1-preview.mp4',
        poster: goldenPart1,
        title: 'Golden Boy, le Best Of — partie 1',
        duration: '7:01',
        description:
          'L’accroche, la bande « facho », le faux animateur radio, un fan, McDo, puis l’inconnu « qui cherche des femmes » : le cœur de la vidéo.',
        credits:
          'Musiques : « hiphop instrumental » (Portmore, Pixabay), « Murder In My Mind » (Kordhell), « Sneaky Snitch » — Kevin MacLeod (incompetech.com), licence CC BY 4.0, « Sahara » (Hensonn), « Clair de lune » (Debussy).',
      },
      {
        file: '/videos/golden-boy-best-of-partie2.mp4',
        fileLight: '/videos/golden-boy-best-of-partie2-480p.mp4',
        preview: '/videos/golden-boy-best-of-partie2-preview.mp4',
        poster: goldenPart2,
        title: 'Golden Boy, le Best Of — partie 2',
        duration: '7:42',
        description: '« Le mec qui tape les gays », l’« influenceur » à 4 viewers, le « président », la voiture, puis le ban d’OmeTV.',
        credits:
          'Musiques : « Metamorphosis » (INTERWORLD), « Sad Violin », « Dior », instrumental (Pop Smoke, prod. 808Melo), « hiphop instrumental » (Portmore, Pixabay), « Jazzy Beat » (Kulakovka, Pixabay), « Frolic » (Luciano Michelini).',
      },
    ],
  },

  {
    slug: 'golden-boy-shorts',
    title: 'Golden Boy, *en 9:16*',
    creator: 'Golden Boy',
    subtitle: 'Extraits du live OmeTV du 24 novembre 2026',
    categories: ['format-court', 'divertissement'],
    editType: 'Extraits verticaux',
    platform: 'TikTok, Reels, Shorts',
    format: '9:16',
    date: '2026-11',
    description:
      'Trois extraits verticaux du même live : l’inconnu qui croit le reconnaître, les messages du chat, deux gars qui l’insultent depuis leur voiture.',
    context: [
      'Dans le live, j’ai cherché les passages qui tiennent seuls, sans contexte : une confrontation, une question qui met mal à l’aise, une chute. Golden Boy reste calme face à des inconnus qui s’emballent : c’est ce contraste qui fait ses vidéos.',
      'Chaque extrait commence en plein échange, sans intro. Dans celui du chat, chaque message s’affiche à l’écran avant sa réponse, pour qu’on suive sans avoir vu le live.',
    ],
    poster: goldenReconnait,
    /* Chiffres du dossier de montage (short_montage/live_goldenboy_24nov/LISEZMOI.md). */
    facts: [
      { value: '3', label: 'extraits verticaux' },
      { value: '1:06 · 0:47 · 1:06', label: 'durée des extraits' },
      { value: '1', label: 'morceau par extrait' },
    ],
    work: [
      { type: 'selection', detail: 'Les passages qui tiennent seuls : une confrontation, une question du chat, une chute.' },
      { type: 'structure', detail: 'Chaque extrait s’ouvre sur la phrase la plus tendue et se ferme sèchement, sur une réplique.' },
      { type: 'habillage', detail: 'Un titre en bandeau blanc ; dans l’extrait du chat, chaque message s’affiche avant la réponse.' },
      { type: 'effets', detail: 'Fin de l’extrait du chat : sa webcam, simple vignette dans le live, agrandie par IA pour passer en plein écran.' },
      { type: 'sousTitres', detail: 'Mot à mot, en jaune et en majuscules.' },
      { type: 'musique', detail: 'Un seul morceau par extrait, bas sous la voix, coupé net juste avant chaque grosse réplique.' },
    ],
    videos: [
      {
        file: '/videos/golden-boy-short-reconnait.mp4',
        preview: '/videos/plan-gb-short-reconnait.mp4',
        poster: goldenReconnait,
        title: 'Il croit me reconnaître sur OmeTV',
        duration: '1:06',
        description: '« C’est pas toi qui vas dans la rue insulter les gays ? » L’inconnu mène l’enquête, Golden Boy reste calme.',
        credits: 'Musique : « Dreamy » (TrapoloskiBeatz).',
      },
      {
        file: '/videos/golden-boy-short-chat.mp4',
        preview: '/videos/plan-gb-short-chat.mp4',
        poster: goldenChat,
        title: 'Mon chat dit : « 99 % physique »',
        duration: '0:47',
        description: 'Il lit les messages du chat à voix haute et les recadre, un par un.',
        credits: 'Musique : « Rapture » (INTERWORLD).',
      },
      {
        file: '/videos/golden-boy-short-voiture.mp4',
        preview: '/videos/plan-gb-short-voiture.mp4',
        poster: goldenVoiture,
        title: 'Ils m’insultent depuis leur voiture',
        duration: '1:06',
        description: '« T’as mis le bonnet de ta sœur ou quoi ? », jusqu’à « 3 500 € par mois, je remplis 4 fois ton frigo ».',
        credits: 'Musique : « No Limit » (NSM Beats).',
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
 * La page des coulisses (/portfolio/behind-the-edit) : le film de démonstration FilmCraft.
 * Tout vient de src/data/coulisses.ts (vidéos, chapitres, crédit musique) : modifiez-le là-bas.
 * Si `videos` est vidé, la page disparaît et `teaser` s'affiche à la place, sans faux contenu.
 */
const clock = (s: number): string => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export const behindTheEdit: ProjectEntry & { teaser: string } = {
  slug: 'behind-the-edit',
  title: 'Behind *the Edit*',
  subtitle: 'Trois montages repris à la timeline, dans FilmCraft',
  editType: 'Coulisses du montage',
  teaser: 'Une vidéo est en préparation : les coulisses d’un montage, de l’analyse des rushs à la livraison.',
  description:
    '42 secondes dans FilmCraft : Victoire Royale, un but de Rocket League et le best-of de Marty, repris à la timeline. Coupes, étalonnage, ralenti, titres et sous-titres, puis le résultat.',
  poster: coulisses.poster,
  duration: '0:42',
  videos: [
    {
      file: coulisses.file,
      fileLight: coulisses.fileLight,
      preview: '/videos/plan-coulisses.mp4',
      poster: coulisses.poster,
      title: coulisses.title,
      playLabel: 'Regarder avec le son',
      duration: '0:42',
      chapters: coulisses.chapters.map((c) => ({ time: clock(c.start), seconds: c.start, label: c.label })),
      credits: coulisses.credits,
    },
  ],
  tools: ['FilmCraft'],
  process: coulisses.chapters.filter((c) => c.num).map((c) => ({ title: c.label, text: c.text })),
};
