/**
 * ─────────────────────────────────────────────────────────────
 *  ÉTAPES D'UNE COLLABORATION
 *  `steps`       : la frise « Processus » de la page d'accueil.
 *  `orderSteps`  : le déroulé détaillé d'une commande (page Contact).
 * ─────────────────────────────────────────────────────────────
 */

export interface Step {
  title: string;
  text: string;
  /** Petite étiquette affichée sur l’étape (facultatif). */
  note?: string;
}

export const steps: Step[] = [
  {
    title: 'Contact',
    text: 'Vous me contactez sur Discord avec quelques mots sur votre projet.',
  },
  {
    title: 'Discussion',
    text: 'On définit ensemble le projet et vos attentes : style, références, délai et tarif.',
  },
  {
    title: 'Réalisation',
    text: 'Je réalise le montage en suivant vos indications : rythme, style, textes, musique.',
  },
  {
    title: 'Livraison',
    text: 'Vous recevez la vidéo finale, prête à être publiée.',
  },
  {
    title: 'Paiement',
    text: 'Une fois le montage livré, vous réglez la prestation via l’offre Apa convenue.',
    note: 'Après livraison',
  },
];

export const orderSteps: Step[] = [
  {
    title: 'Premier message sur Discord',
    text: 'Présentez votre projet en quelques lignes : type de vidéo, durée des rushs, plateforme visée.',
  },
  {
    title: 'Discussion et tarif',
    text: 'On précise ensemble le style, les références, le délai et l’offre qui correspond. Rien n’est à payer à ce stade.',
  },
  {
    title: 'Réalisation',
    text: 'Je réalise le montage en suivant ce que nous avons défini ensemble.',
  },
  {
    title: 'Livraison',
    text: 'Je vous envoie la vidéo finale, prête à être publiée.',
  },
  {
    title: 'Paiement via Apa',
    text: 'Une fois la vidéo reçue, vous réglez avec l’offre convenue, sur la page de paiement sécurisée d’Apa.',
    note: 'Après livraison',
  },
];

/** Modèle de brief que le visiteur peut copier puis coller sur Discord. */
export const briefTemplate = `Bonjour ! J'ai un projet de montage :
• Plateforme : (YouTube / TikTok / Reels / autre)
• Type de vidéo :
• Durée des rushs :
• Durée finale souhaitée :
• Références / style :
• Délai : `;
