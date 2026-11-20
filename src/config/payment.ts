/**
 * ─────────────────────────────────────────────────────────────
 *  OFFRES ET PAIEMENT (Apa)
 *  Deux façons de régler (en une fois, en fin de mois), chacune pour
 *  une vidéo courte et une vidéo longue : quatre offres, quatre liens Apa.
 *  Le paiement en fin de mois n'est PAS un abonnement : un seul
 *  règlement, à la fin du mois, pour les prestations convenues.
 *  Les paiements sont hébergés sur apa.app : le site ne fait que
 *  rediriger vers vos liens. Aucune donnée de paiement n'est
 *  enregistrée ici et aucun wallet ne se connecte au site.
 *
 *  ⚠️ Le montant affiché doit toujours correspondre à celui
 *  configuré sur le lien Apa : si vous changez l'un, changez l'autre.
 * ─────────────────────────────────────────────────────────────
 */

export type Billing = 'une-fois' | 'fin-de-mois';
export type VideoFormat = 'short' | 'long';

export interface Promo {
  /** false : badge, code et mise en avant disparaissent du site. */
  active: boolean;
  /** Code à saisir par le client sur la page Apa (il doit exister dans votre tableau de bord Apa). */
  code: string;
  /** Réduction appliquée par Apa (affichage uniquement, le site ne calcule aucun prix). */
  percent: number;
  /** Nom de l'opération, affiché avant la réduction (facultatif). */
  label?: string;
  /** Dernier jour de validité (AAAA-MM-JJ). Passé cette date, la promo disparaît du site. */
  until?: string;
  /** true : la carte est mise en avant (halo rouge, bouton plein). */
  highlight?: boolean;
}

export interface Package {
  id: string;
  billing: Billing;
  format: VideoFormat;
  /** Montant en dollars US, identique à celui affiché sur la page Apa. */
  amount: number;
  /** Lien de paiement Apa (doit commencer par https://apa.app/pay/). */
  href: string;
  promo?: Promo;
}

/** Les deux formats : même description dans les deux façons de régler. */
export const formats: Record<VideoFormat, { name: string; spec: string; description: string }> = {
  short: {
    name: 'Vidéo courte',
    spec: '9:16 · TikTok, Reels',
    description:
      'Format vertical pour TikTok et Reels : une accroche dès la première seconde, des sous-titres dynamiques, des coupes calées sur le son.',
  },
  long: {
    name: 'Vidéo longue',
    spec: '16:9 · YouTube, 10 min et plus',
    description:
      'Long format YouTube, ma spécialité : une structure, un rythme et des temps forts pour garder le public jusqu’au bout.',
  },
};

/** Les deux façons de régler, dans l'ordre d'affichage. */
export const billings: Record<
  Billing,
  {
    title: string;
    text: string;
    /** Précision affichée sous le texte (facultatif). */
    note?: string;
    fit: string;
    unit: string;
    cta: string;
    /** Frise décorative : libellé du groupe, largeurs relatives des clips, libellé du paiement. */
    cadence: { label: string; clips: number[]; pay: string };
  }
> = {
  'une-fois': {
    title: 'Paiement en une fois',
    text: 'Une vidéo, un règlement, dès la vidéo livrée.',
    fit: 'Pour un projet précis ou une première collaboration.',
    unit: 'USD · réglé en une fois',
    cta: 'Payer ma vidéo',
    cadence: { label: 'Une vidéo', clips: [1], pay: 'Paiement' },
  },
  'fin-de-mois': {
    title: 'Paiement en fin de mois',
    text: 'On convient ensemble des prestations du mois, je les réalise au fil du mois, puis vous réglez le tout en une seule fois à la fin du mois.',
    note: 'Pas d’abonnement ni de prélèvement automatique : un seul règlement, à la fin du mois.',
    fit: 'Une solution adaptée aux collaborations régulières, proposée une fois qu’une relation de confiance est installée.',
    unit: 'USD · réglé en une fois, en fin de mois',
    cta: 'Régler le mois écoulé',
    cadence: { label: 'Prestations du mois', clips: [3, 5, 2, 4], pay: 'Un seul paiement' },
  },
};

export const payment = {
  /** Phrase d'introduction de la section « Choose Your Editing Package ». */
  intro:
    'Deux façons de régler, chacune pour une vidéo courte ou une vidéo longue : en une fois, dès la vidéo livrée, ou en un seul règlement à la fin du mois pour une collaboration suivie. Le paiement se fait en crypto, sur Apa.',

  /**
   * Les quatre offres. Chaque `href` est un lien Apa : le montant ci-dessous
   * reprend exactement celui configuré sur ce lien.
   */
  packages: [
    {
      id: 'courte-une-fois',
      billing: 'une-fois',
      format: 'short',
      amount: 2.35,
      href: 'https://apa.app/pay/cmwpboxu8000srv01qlyu7vl0',
      promo: { active: true, code: 'SHORT10', percent: 30, until: '2027-02-08', highlight: true },
    },
    {
      id: 'longue-une-fois',
      billing: 'une-fois',
      format: 'long',
      amount: 18,
      href: 'https://apa.app/pay/cmw10n9ai000eqr01q6mv3liw',
    },
    {
      id: 'courte-fin-de-mois',
      billing: 'fin-de-mois',
      format: 'short',
      amount: 328,
      href: 'https://apa.app/pay/cmwpbqnzl000wrv01kys1cc70',
    },
    {
      id: 'longue-fin-de-mois',
      billing: 'fin-de-mois',
      format: 'long',
      amount: 750,
      href: 'https://apa.app/pay/cmwpbpwjv000urv01wk8xxvq1',
      promo: { active: true, code: 'LONG50', percent: 20, label: 'Offre de lancement' },
    },
  ] satisfies Package[] as Package[],

  /** Garanties affichées sous les offres. */
  trust: [
    'Paiement hébergé sur apa.app',
    'Aucun wallet à connecter sur ce site',
    'Aucune donnée de paiement enregistrée ici',
  ],

  /** Encadré de sécurité (page Contact) et réponse de la FAQ. */
  safety:
    'Les seuls liens de paiement valides sont ceux de cette page : ils commencent tous par https://apa.app/pay/. En cas de doute, demandez-moi confirmation sur Discord avant de payer.',
};

/* ── Helpers (rien à modifier ci-dessous) ─────────────────────── */

const APA_PREFIX = 'https://apa.app/pay/';

export const isApaLink = (href: string): boolean => href.startsWith(APA_PREFIX) && href.length > APA_PREFIX.length;

/** 8 → « 8 », 2.35 → « 2,35 » (format français). */
export const formatUsd = (value: number): string =>
  new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);

/** Fin du dernier jour de validité, heure locale du visiteur. */
export const promoEnd = (until: string): Date => new Date(`${until}T23:59:59`);

/** « 2027-02-08 » → « 8 février 2027 ». */
export const formatDay = (until: string): string =>
  new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(promoEnd(until));

/** La promo affichée pour une offre : active et pas encore expirée (au moment du build). */
export const activePromo = (pkg: Package): Promo | undefined =>
  pkg.promo?.active && (!pkg.promo.until || Date.now() <= promoEnd(pkg.promo.until).getTime()) ? pkg.promo : undefined;

/** L'offre d'une façon de régler et d'un format donnés. */
export const packageFor = (billing: Billing, format: VideoFormat): Package | undefined =>
  payment.packages.find((p) => p.billing === billing && p.format === format);

/* Garde-fous au build : lien Apa valide, un lien distinct par offre, une offre par case. */
const seen = new Set<string>();
for (const pkg of payment.packages) {
  if (!isApaLink(pkg.href)) {
    console.warn(`\n[nether] ⚠️  Offre « ${pkg.id} » : le lien doit commencer par ${APA_PREFIX}. Le bouton est masqué.\n`);
  }
  if (seen.has(pkg.href)) console.warn(`\n[nether] ⚠️  Offre « ${pkg.id} » : ce lien Apa est déjà utilisé par une autre offre.\n`);
  seen.add(pkg.href);
  if (pkg.promo?.until && Number.isNaN(promoEnd(pkg.promo.until).getTime())) {
    console.warn(`\n[nether] ⚠️  Offre « ${pkg.id} » : date de fin de promo illisible (format attendu AAAA-MM-JJ).\n`);
  }
}
for (const b of Object.keys(billings) as Billing[]) {
  for (const f of Object.keys(formats) as VideoFormat[]) {
    if (payment.packages.filter((p) => p.billing === b && p.format === f).length !== 1) {
      console.warn(`\n[nether] ⚠️  Il faut exactement une offre « ${billings[b].title} · ${formats[f].name} ».\n`);
    }
  }
}
