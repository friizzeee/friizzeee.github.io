/**
 * Disposition de la galerie : la place que prend chaque carte.
 *
 * Partagé entre le rendu des pages (Astro) et les filtres (navigateur) : quand le visiteur
 * filtre, la grille se recompose avec la même règle que si la page avait été écrite ainsi.
 * Ce fichier ne doit rien importer du reste du portfolio (il est chargé dans le navigateur).
 *
 * Règle, pour les vidéos horizontales :
 *   1 projet   → une grande ligne (image à gauche, fiche à droite)
 *   2 projets  → deux grandes lignes, en miroir
 *   3 et plus  → une grande ligne, puis des paires 7 / 5 colonnes en quinconce ;
 *                s'il en reste un seul à la fin, il reprend une grande ligne en miroir.
 * Les vidéos verticales (9:16) prennent un tiers de la largeur.
 */

export type Slot = 'lead' | 'lead-alt' | 'wide' | 'narrow' | 'tall';

export interface Placement {
  slot: Slot;
  /** Carte décalée vers le bas : donne le rythme en quinconce. */
  offset: boolean;
}

export function arrange(items: readonly { vertical: boolean }[]): Placement[] {
  const placements: Placement[] = items.map(() => ({ slot: 'tall', offset: false }));
  const horizontal = items.flatMap((item, index) => (item.vertical ? [] : [index]));

  horizontal.forEach((index, n) => {
    if (n === 0) {
      placements[index] = { slot: 'lead', offset: false };
      return;
    }
    if (horizontal.length === 2) {
      placements[index] = { slot: 'lead-alt', offset: false };
      return;
    }
    const rest = n - 1;
    const pair = Math.floor(rest / 2);
    const second = rest % 2 === 1;
    const alone = !second && n === horizontal.length - 1;
    if (alone) {
      placements[index] = { slot: 'lead-alt', offset: false };
      return;
    }
    // Paires alternées : large puis étroite, étroite puis large.
    const wideFirst = pair % 2 === 0;
    placements[index] = { slot: second === wideFirst ? 'narrow' : 'wide', offset: second };
  });

  return placements;
}
