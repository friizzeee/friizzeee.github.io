/**
 * Séquence « Coulisses » de l'accueil : la vidéo de démonstration, ses chapitres,
 * ses moments forts, puis la carte du profil Discord qui la conclut.
 * Composant : src/components/home/Coulisses.astro · comportement : src/scripts/modules/coulisses.ts
 */
import ouverture from '../assets/coulisses/coulisses-ouverture.jpg';
import fin from '../assets/coulisses/coulisses-fin.jpg';
import avatar from '../assets/coulisses/discord-avatar.png';
import tagBadge from '../assets/coulisses/discord-tag-fibo.png';

export const coulisses = {
  /** Version 1080p (22,4 Mo) et version allégée 720p (10,7 Mo), tirées de coulisses/claude-montage-filmcraft-HORIZONTAL-V2.mp4. */
  file: '/videos/coulisses-filmcraft.mp4',
  fileLight: '/videos/coulisses-filmcraft-720p.mp4',
  /** Première image utile (0:02) et carton de fin (0:40), extraits de la vidéo. */
  poster: ouverture,
  endFrame: fin,
  duration: 42.1,
  title: 'Coulisses : trois montages dans FilmCraft',
  /** Licence CC BY 4.0 : le crédit doit rester affiché sous la vidéo. */
  credits: 'Musique : « Brain Dance », Kevin MacLeod (incompetech.com), licence CC BY 4.0.',
  /** Début de chaque partie, en secondes, relevé image par image. `led` = couleur des LED du décor dans la vidéo. */
  chapters: [
    {
      start: 0,
      num: '',
      label: 'Ouverture',
      led: '#e5162a',
      text: 'Le bureau s’allume : trois projets à reprendre dans FilmCraft.',
    },
    {
      start: 3,
      num: '01',
      label: 'Fortnite',
      led: '#9b4dff',
      text: 'Victoire Royale : entrée à 2:52, sortie à 2:56:59, insertion dans la séquence, échelle à 110 %, puis lecture.',
    },
    {
      start: 16.6,
      num: '02',
      label: 'Rocket League',
      led: '#3d8bff',
      text: 'Coupe au Ctrl+K, étalonnage « Tons foncés bleu canard », vitesse à 47 %, titre « GOAL ! » et but au ralenti.',
    },
    {
      start: 26.4,
      num: '03',
      label: 'Marty',
      led: '#34c46a',
      text: 'Best-of de Marty : un live de 2 h dans le moniteur Source, points d’entrée et de sortie, sous-titres et pop-up, puis le résultat.',
    },
    {
      start: 38.1,
      num: '',
      label: 'Fin',
      led: '#e5162a',
      text: 'Raw footage in. Watch time out.',
    },
  ],
  /** Moments forts, marqués sur la timeline et cliquables. */
  markers: [
    { at: 14.6, label: '« ET DE 5 ! »' },
    { at: 23.8, label: 'But au ralenti' },
    { at: 34.2, label: 'Best-of fini, 18:15' },
  ],
} as const;

/**
 * Profil Discord, recopié du profil réel (relevé le 20/11/2026 sur discord.com/users/1570838778132693044).
 * Le lien et le pseudo viennent de src/config/site.ts.
 */
export const discordProfile = {
  avatar,
  /** Nom affiché : une seule lettre gothique (U+1D56F). */
  displayName: '𝕯',
  displayNameSpoken: 'D',
  tag: 'FIBO',
  tagBadge,
  /** Bio telle qu'affichée par Discord : tout en gras italique, deux passages soulignés. */
  bio: [
    { text: '"\'--' },
    { text: 'Monter\'"', underline: true },
    { text: '--"\'\'"\'--' },
    { text: 'Finance and trading\'"', underline: true },
    { text: '--"\'\'' },
  ],
} as const;
