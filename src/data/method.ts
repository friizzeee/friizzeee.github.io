/**
 * ─────────────────────────────────────────────────────────────
 *  MA MÉTHODE DE MONTAGE (section « Du rush au master » de l'accueil)
 *  Six étapes. Chacune a un texte général (`text`) et ce qu'elle a donné sur
 *  un vrai montage (`example`) : Victoire Royale, dont la bande animée à côté
 *  reprend les vrais chiffres (src/data/vr-loudness.ts pour le son).
 *  `stage` règle l'état de la bande : gardez l'ordre des six étapes.
 *
 *  À ne pas confondre avec src/data/process.ts : le déroulé d'une commande
 *  (contact, discussion, livraison, paiement).
 * ─────────────────────────────────────────────────────────────
 */

export type MethodStage = 'rush' | 'cut' | 'edit' | 'sound' | 'fx' | 'master';

export interface MethodStep {
  title: string;
  text: string;
  example: string;
  stage: MethodStage;
}

export const method: {
  title: string;
  lead: string;
  steps: MethodStep[];
} = {
  title: 'Du rush au master.',

  lead: 'Monter, ce n’est pas seulement couper. Voici les six étapes de chaque vidéo, montrées sur un vrai montage : les 13 minutes 23 de partie devenues Victoire Royale.',

  steps: [
    {
      title: 'Analyse des rushs',
      text: 'Je récupère les vidéos originales et j’analyse leur contenu pour comprendre le contexte, le style et les moments intéressants.',
      example: '13 min 23 de partie, en 1600 × 900, à environ 120 images par seconde. Le son du jeu, et aucune voix.',
      stage: 'rush',
    },
    {
      title: 'Sélection des meilleurs passages',
      text: 'Je sélectionne les passages pertinents, supprime les longueurs et construis une structure cohérente.',
      example: 'L’île d’attente et les menus (les 47 premières secondes), le loot et les trajets sans enjeu partent. Il reste 5 min 40.',
      stage: 'cut',
    },
    {
      title: 'Montage et rythme',
      text: 'Je travaille le rythme, les coupes, les zooms et la structure, pour que chaque minute donne envie de regarder la suivante.',
      example: '68 plans en 8 chapitres. Les combats restent en temps réel ; un zoom part sur chaque élimination, calé sur l’image du kill.',
      stage: 'edit',
    },
    {
      title: 'Sound design',
      text: 'Effets sonores, musique et mixage : le son raconte autant que l’image, surtout quand il n’y a pas de voix.',
      example: 'Impacts, whoosh, une montée avant le dernier duel. Quatre morceaux dont le niveau suit l’action : voici la vraie courbe du mix.',
      stage: 'sound',
    },
    {
      title: 'Transitions et effets visuels',
      text: 'Transitions, textes, ralentis et effets, seulement là où ils servent l’histoire.',
      example: 'Coupes franches par défaut, dix transitions réservées aux changements d’acte. Arrêt sur image en noir et blanc pour l’accroche, deux vrais ralentis grâce aux 120 i/s.',
      stage: 'fx',
    },
    {
      title: 'Finitions et livraison',
      text: 'Je vérifie le résultat, les enchaînements, le son et la qualité générale, puis je livre le montage final.',
      example: 'Étalonnage global, mix mesuré à −14,5 LUFS (YouTube vise −14), export en 1920 × 1080 à 60 images par seconde.',
      stage: 'master',
    },
  ],
};
