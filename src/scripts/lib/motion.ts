/**
 * Repères de mouvement partagés : durées, courbes, décalages et distances.
 * Les modules du portfolio s'en servent au lieu de chiffres posés au cas par cas,
 * pour que les animations gardent le même tempo d'une page à l'autre.
 */
export const motion = {
  /** En secondes. */
  duration: { quick: 0.25, base: 0.6, slow: 0.9, reveal: 1.2 },
  ease: { out: 'expo.out', in: 'power2.in', inOut: 'expo.inOut', soft: 'power3.out' },
  /** Décalage entre les éléments d'une série : entre 0,05 et 0,10 s (en dessous c'est mécanique, au-dessus c'est mou). */
  stagger: { tight: 0.05, base: 0.07, wide: 0.1 },
  /** En pixels. */
  distance: { sm: 12, md: 24, lg: 40 },
} as const;
