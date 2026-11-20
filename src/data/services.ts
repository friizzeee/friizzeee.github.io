/**
 * ─────────────────────────────────────────────────────────────
 *  SERVICES
 *  Modifiez librement les textes. L'ordre du tableau = l'ordre
 *  d'affichage. `featured: true` = la grande carte « Spécialité ».
 * ─────────────────────────────────────────────────────────────
 */

export type ServiceVisual = 'timeline' | 'captions' | 'loop';

export interface Service {
  id: string;
  title: string;
  /** Format affiché en petit (ex. « 16:9 · 10 min + »). */
  format: string;
  description: string;
  /** Points forts listés sur la carte (surtout utile pour la carte vedette). */
  points: string[];
  /** Univers / styles affichés en étiquettes. */
  tags: string[];
  featured?: boolean;
  /**
   * Catégorie du portfolio à montrer en exemple (clé de `categories` dans src/data/portfolio.ts).
   * Le lien « Voir les montages » n'apparaît que si cette catégorie contient au moins un projet en ligne.
   */
  examples?: string;
  /** Animation décorative de la carte. */
  visual: ServiceVisual;
}

export const services: Service[] = [
  {
    id: 'youtube',
    title: 'YouTube long format',
    format: '16:9 · 10 min et plus',
    description:
      'Des vidéos longues qui tiennent jusqu’à la dernière seconde. Je construis la structure, le rythme et les temps forts pour que le public reste, chapitre après chapitre.',
    points: [
      'Storytelling et structure en actes',
      'Accroche et rétention',
      'Sound design et musique',
      'Textes et sous-titres à l’écran',
    ],
    tags: ['Storytelling', 'Gaming', 'Business', 'Finance', 'Crypto'],
    featured: true,
    examples: 'long-format',
    visual: 'timeline',
  },
  {
    id: 'tiktok',
    title: 'Montage TikTok',
    format: '9:16 · formats courts',
    description:
      'Des vidéos verticales nerveuses : une accroche dès la première seconde, des sous-titres dynamiques et des coupes calées sur le son.',
    points: [],
    tags: ['Hook', 'Sous-titres', 'Rythme'],
    examples: 'format-court',
    visual: 'captions',
  },
  {
    id: 'reels',
    title: 'Reels Instagram',
    format: '9:16 · Reels',
    description:
      'Des Reels soignés et rythmés, pensés pour arrêter le scroll : transitions propres, textes lisibles et une boucle fluide.',
    points: [],
    tags: ['Transitions', 'Boucle', 'Esthétique'],
    examples: 'format-court',
    visual: 'loop',
  },
];

/** Les univers qui défilent dans le bandeau sous le hero. */
export const universes: string[] = [
  'Storytelling',
  'Gaming',
  'Business',
  'Finance',
  'Crypto',
  'Vlog',
  'Podcast',
  'Tech',
  'Lifestyle',
  'Éducation',
];
