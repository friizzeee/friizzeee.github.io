/**
 * ─────────────────────────────────────────────────────────────
 *  SECTION « À PROPOS »
 *  Pour ajouter votre photo : placez-la dans src/assets/
 *  puis décommentez les deux lignes « portrait » ci-dessous.
 * ─────────────────────────────────────────────────────────────
 */
import type { ImageMetadata } from 'astro';
// import portraitImage from '../assets/portrait.jpg';

export const about: {
  title: [string, string];
  paragraphs: string[];
  interests: string[];
  /** Les trois domaines que je connais de l'intérieur, et ce que ça change dans une vidéo. */
  expertise: { title: string; text: string }[];
  note: string;
  /** Fiche « inspecteur de clip » affichée sur le visuel (libellé → valeur). */
  profile: { label: string; value: string }[];
  portrait?: ImageMetadata;
} = {
  /** Titre en deux parties : la seconde passe en italique serif. */
  title: ['Un monteur qui parle', 'votre langage.'],

  paragraphs: [
    'Derrière nether, il y a un monteur passionné par l’image, le rythme et les histoires bien racontées. Mon terrain de jeu préféré : les vidéos longues, où chaque minute doit donner envie de regarder la suivante.',
    'Depuis un certain temps, je m’intéresse de près à l’investissement, en particulier aux cryptomonnaies et au trading. Je suis l’actualité des marchés financiers, des nouvelles technologies et de l’économie numérique.',
    'Cet univers, je le connais de l’intérieur. Quand vous me confiez une vidéo sur la finance, le business ou la crypto, je comprends le sujet, le vocabulaire et ce qui doit ressortir à l’écran.',
  ],

  interests: ['Cryptomonnaies', 'Marchés financiers', 'Nouvelles technologies', 'Économie numérique', 'Création de contenu'],

  expertise: [
    {
      title: 'Crypto',
      text: 'Je m’y intéresse de près depuis un certain temps. Je connais le sujet et son vocabulaire : pas besoin de m’expliquer chaque terme avant de monter.',
    },
    {
      title: 'Trading',
      text: 'Je suis l’actualité des marchés financiers. Dans une vidéo de trading, je sais repérer le moment qui compte et ce qui doit ressortir à l’écran.',
    },
    {
      title: 'Digital',
      text: 'Nouvelles technologies, économie numérique, création de contenu : j’en suis l’actualité, et je monte pour les plateformes où ces sujets se regardent.',
    },
  ],

  note: 'Un intérêt personnel, pas un métier : je ne suis ni trader professionnel ni conseiller financier.',

  profile: [
    { label: 'Spécialité', value: 'Vidéos longues, 10 min et plus' },
    { label: 'Formats', value: 'YouTube · TikTok · Reels' },
    { label: 'Univers', value: 'Gaming · Business · Finance · Crypto' },
    { label: 'Contact', value: 'Discord' },
  ],

  // portrait: portraitImage,
};
