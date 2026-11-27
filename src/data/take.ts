/**
 * ─────────────────────────────────────────────────────────────
 *  LE PLAN-SÉQUENCE DE L'ACCUEIL (la balade dans le studio)
 *  « Plan 01 » est l'entrée du couloir. Puis un arrêt par alcôve : l'écran à gauche,
 *  la fiche à droite (en bas sur téléphone), et la vraie vidéo, muette, qui tourne
 *  sur l'écran du décor. Le dernier arrêt est le bureau de montage, au bout du couloir.
 *
 *  Les vidéos complètes, durées et crédits viennent du portfolio
 *  (champ `project` = slug dans src/data/portfolio.ts).
 *  Le décor et le trajet de la caméra sont rendus dans Blender
 *  (tools/plan-sequence/render_walk.py) : chaque écran du décor y a un identifiant
 *  (`screens[].id`). Ajouter un arrêt demande donc un nouveau rendu ; un nouveau projet
 *  apparaît de toute façon dans « Réalisations ».
 * ─────────────────────────────────────────────────────────────
 */
import type { ImageMetadata } from 'astro';
import vrLoop from '../assets/take/plan-victoire-royale.jpg';
import martyLoop from '../assets/take/plan-marty.jpg';
import nvidiaLoop from '../assets/take/plan-short-nvidia.jpg';
import bottomLoop from '../assets/take/plan-short-55k.jpg';
import goldenLoop from '../assets/take/plan-golden-boy.jpg';
import reconnaitLoop from '../assets/take/plan-gb-short-reconnait.jpg';
import chatLoop from '../assets/take/plan-gb-short-chat.jpg';
import voitureLoop from '../assets/take/plan-gb-short-voiture.jpg';
import coulissesLoop from '../assets/take/plan-coulisses.jpg';

/** Un écran du décor : sa boucle muette et la première image de la boucle (celle qui est peinte sur l'écran). */
export interface Screen {
  /** Identifiant de l'écran dans le rendu Blender (corners.json). */
  id: string;
  src: string;
  poster: ImageMetadata;
  /** Format de la boucle. */
  ratio: '16:9' | '9:16';
}

export interface Stop {
  id: 'victoire-royale' | 'marty-best-of' | 'marty-shorts' | 'golden-boy-best-of' | 'golden-boy-shorts' | 'coulisses';
  /** Nom de l'arrêt dans le rendu (corners.json → stops). */
  mark: string;
  /** Slug du projet dont viennent les boutons de lecture et le lien « fiche du projet ». */
  project: string;
  kicker: string;
  title: string;
  /** En exposant après le titre, comme « 48 m² » dans la référence : ici, la durée. */
  sup: string;
  lede: string;
  body: string;
  screens: Screen[];
}

export const hint = 'Faites défiler, on entre';

export const stops: Stop[] = [
  {
    id: 'victoire-royale',
    mark: 'vr',
    project: 'victoire-royale',
    kicker: 'Plan 02 · Gaming',
    title: 'Victoire Royale',
    sup: '5:40',
    lede: '13 minutes de partie, sans un mot. Il en reste 5 min 40, et une histoire.',
    body: 'L’accroche montre le dernier duel, le fige en noir et blanc, puis rembobine jusqu’au début de la partie. Sans voix off : ce sont les textes, la musique et le son qui racontent.',
    screens: [{ id: 'vr', src: '/videos/plan-victoire-royale.mp4', poster: vrLoop, ratio: '16:9' }],
  },
  {
    id: 'marty-best-of',
    mark: 'marty',
    project: 'marty-best-of',
    kicker: 'Plan 03 · Crypto & Trading',
    title: 'Marty, le Best Of',
    sup: '18:15',
    lede: 'Quatre lives de crypto et de trading. 18 minutes 15, en trois parties.',
    body: 'Chaque coupe tombe sur un silence de sa voix, pour que les phrases restent entières. 139 phrases sous-titrées une par une, 38 pop-ups qui arrivent au moment où il en parle.',
    screens: [{ id: 'marty', src: '/videos/plan-marty.mp4', poster: martyLoop, ratio: '16:9' }],
  },
  {
    id: 'marty-shorts',
    mark: 'marty-shorts',
    project: 'marty-shorts',
    kicker: 'Plan 04 · Formats courts',
    title: 'Marty, en 9:16',
    sup: '0:38 · 0:30',
    lede: 'Une analyse de 10 min 37. Deux extraits verticaux qui se comprennent sans elle.',
    body: 'Le second remet trois passages dans l’ordre d’une histoire : la question, la menace, le plan, l’espoir. Un seul pop-up par extrait, des sous-titres sur l’accroche et la chute.',
    screens: [
      { id: 'marty-shorts-0', src: '/videos/plan-short-nvidia.mp4', poster: nvidiaLoop, ratio: '9:16' },
      { id: 'marty-shorts-1', src: '/videos/plan-short-55k.mp4', poster: bottomLoop, ratio: '9:16' },
    ],
  },
  {
    id: 'golden-boy-best-of',
    mark: 'gb',
    project: 'golden-boy-best-of',
    kicker: 'Plan 05 · Clashs en live',
    title: 'Golden Boy, le Best Of',
    sup: '14:43',
    lede: 'Une session OmeTV d’1 h 33, en plein live. Il en reste 14 min 43, dans son style à lui.',
    body: 'Ni chapitre ni carton, comme sur sa chaîne : 76 coupes sèches, toutes dans un silence, 22 zooms sur les répliques, 15 punchlines sous-titrées. La musique n’arrive que sur les clashs.',
    screens: [{ id: 'gb', src: '/videos/plan-golden-boy.mp4', poster: goldenLoop, ratio: '16:9' }],
  },
  {
    id: 'golden-boy-shorts',
    mark: 'gb-shorts',
    project: 'golden-boy-shorts',
    kicker: 'Plan 06 · Formats courts',
    title: 'Golden Boy, en 9:16',
    sup: '3 extraits',
    lede: 'Trois extraits du même live : l’inconnu qui croit le reconnaître, le chat, la voiture.',
    body: 'Un titre en bandeau blanc, les sous-titres mot à mot en jaune, un seul morceau par extrait, coupé net juste avant chaque grosse réplique.',
    screens: [
      { id: 'gb-shorts-0', src: '/videos/plan-gb-short-reconnait.mp4', poster: reconnaitLoop, ratio: '9:16' },
      { id: 'gb-shorts-1', src: '/videos/plan-gb-short-chat.mp4', poster: chatLoop, ratio: '9:16' },
      { id: 'gb-shorts-2', src: '/videos/plan-gb-short-voiture.mp4', poster: voitureLoop, ratio: '9:16' },
    ],
  },
  {
    id: 'coulisses',
    mark: 'desk',
    project: 'behind-the-edit',
    kicker: 'Plan 07 · Coulisses',
    title: 'Dans FilmCraft',
    sup: '0:42',
    lede: 'Au bout du couloir, le bureau. 42 secondes à la timeline : Victoire Royale, un but de Rocket League et le best-of de Marty.',
    body: 'Coupes, étalonnage, ralenti, titres et sous-titres, puis le résultat : la démonstration de mon processus de montage.',
    screens: [{ id: 'desk', src: '/videos/plan-coulisses.mp4', poster: coulissesLoop, ratio: '16:9' }],
  },
];
