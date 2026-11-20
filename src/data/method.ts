/**
 * ─────────────────────────────────────────────────────────────
 *  MA MÉTHODE DE MONTAGE
 *  Les cinq étapes affichées sur la page Portfolio (section « Méthode »).
 *  Modifiez librement les textes. La timeline animée à côté des étapes
 *  a cinq états, un par étape : gardez cinq étapes pour qu'ils correspondent.
 *
 *  À ne pas confondre avec src/data/process.ts, qui décrit le déroulé
 *  d'une commande (contact, discussion, livraison, paiement).
 * ─────────────────────────────────────────────────────────────
 */

export interface MethodStep {
  title: string;
  text: string;
  /** Mot affiché dans l'en-tête de la timeline quand cette étape est à l'écran. */
  status: string;
}

export const method: {
  /** Titre en deux parties : la seconde passe en italique serif. */
  title: [string, string];
  lead: string;
  steps: MethodStep[];
} = {
  title: ['Monter, ce n’est pas', 'seulement couper.'],

  lead: 'Derrière chaque vidéo, il y a cinq étapes. Voici comment je procède, des rushs bruts au fichier livré.',

  steps: [
    {
      title: 'Analyse des rushs',
      text: 'Je récupère les vidéos originales du client et j’analyse leur contenu pour comprendre le contexte, le style et les moments intéressants.',
      status: 'Rushs importés',
    },
    {
      title: 'Sélection des meilleurs moments',
      text: 'Je sélectionne les passages pertinents, supprime les longueurs et construis une structure cohérente.',
      status: 'Sélection',
    },
    {
      title: 'Montage et réalisation',
      text: 'Je travaille le rythme, les cuts, les transitions, les zooms, les effets visuels, le sound design et les sous-titres selon les besoins du projet.',
      status: 'Montage',
    },
    {
      title: 'Finition',
      text: 'Je vérifie le résultat, les enchaînements, le son et la qualité générale de la vidéo.',
      status: 'Vérification',
    },
    {
      title: 'Livraison',
      text: 'Je livre le montage final au client.',
      status: 'Export',
    },
  ],
};
