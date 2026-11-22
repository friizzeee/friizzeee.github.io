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
import { promoEnd } from '../lib/promo-date';

export type Billing = 'une-fois' | 'fin-de-mois';
export type VideoFormat = 'short' | 'long';

export interface Promo {
  /** false : badge, code et mise en avant disparaissent du site. */
  active: boolean;
  /** Code à saisir par le client sur la page Apa (il doit exister dans votre tableau de bord Apa). */
  code: string;
  /** Réduction en %, affichée sur le badge. Sert aussi au calcul du prix réduit si `amountOff` est absent. */
  percent: number;
  /** Réduction fixe en dollars, si le coupon Apa est un montant et non un pourcentage. */
  amountOff?: number;
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
    cadence: { label: 'Votre vidéo', clips: [1], pay: 'Paiement à la livraison' },
  },
  'fin-de-mois': {
    title: 'Paiement en fin de mois',
    text: 'On convient ensemble des prestations du mois, je les réalise au fil du mois, puis vous réglez le tout en une seule fois à la fin du mois.',
    note: 'Pas d’abonnement ni de prélèvement automatique : un seul règlement, à la fin du mois.',
    fit: 'Une solution adaptée aux collaborations régulières, proposée une fois qu’une relation de confiance est installée.',
    unit: 'USD · réglé en une fois, en fin de mois',
    cta: 'Régler le mois écoulé',
    cadence: { label: 'Les prestations du mois', clips: [3, 5, 2, 4], pay: 'Un seul paiement, fin du mois' },
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
      href: 'https://apa.app/pay/cmwrpfsqi0030ml013su0huj7',
      // Sur Apa, SHORT30 = 0,71 $ fixes (≈ 30 % de 2,35 $) : un pourcentage marcherait aussi sur l'offre à 750 $.
      promo: { active: true, code: 'SHORT30', percent: 30, amountOff: 0.71, until: '2027-02-08', highlight: true },
    },
    {
      id: 'longue-une-fois',
      billing: 'une-fois',
      format: 'long',
      amount: 18,
      href: 'https://apa.app/pay/cmwrpgeuo0032ml01c9ips94a',
    },
    {
      id: 'courte-fin-de-mois',
      billing: 'fin-de-mois',
      format: 'short',
      amount: 328,
      href: 'https://apa.app/pay/cmwrpgy150034ml01caupamb5',
    },
    {
      id: 'longue-fin-de-mois',
      billing: 'fin-de-mois',
      format: 'long',
      amount: 750,
      href: 'https://apa.app/pay/cmwrphitr0036ml01ltg28jx4',
      // Sur Apa, LONG50 = −20 % avec 750 $ minimum (il ne s'applique donc qu'à cette offre).
      promo: { active: true, code: 'LONG50', percent: 20, until: '2027-02-08', highlight: true },
    },
  ] satisfies Package[] as Package[],

  /** Claquette des promos, au-dessus des offres (la date de fin est ajoutée automatiquement). */
  launch: {
    title: 'Offres de lancement',
    after: 'Passé cette date, les codes ne fonctionnent plus et les offres reviennent à leur prix normal.',
    fees: 'Prix avec le code, hors frais de conversion éventuels d’Apa.',
  },

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

export { promoEnd };

/** Prix payé avec le code, arrondi au centime (avant frais de conversion éventuels d'Apa). */
export const promoPrice = (pkg: Package, promo: Promo): number =>
  Math.round((promo.amountOff !== undefined ? pkg.amount - promo.amountOff : pkg.amount * (1 - promo.percent / 100)) * 100) /
  100;

/** « 2027-02-08 » → « 8 février 2027 » (ou « lundi 8 février 2027 » avec le jour). */
export const formatDay = (until: string, withWeekday = false): string =>
  new Intl.DateTimeFormat('fr-FR', {
    weekday: withWeekday ? 'long' : undefined,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(promoEnd(until));

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
  if (pkg.promo && !(promoPrice(pkg, pkg.promo) > 0 && promoPrice(pkg, pkg.promo) < pkg.amount)) {
    console.warn(`\n[nether] ⚠️  Offre « ${pkg.id} » : le prix avec le code ${pkg.promo.code} est incohérent.\n`);
  }
}
for (const b of Object.keys(billings) as Billing[]) {
  for (const f of Object.keys(formats) as VideoFormat[]) {
    if (payment.packages.filter((p) => p.billing === b && p.format === f).length !== 1) {
      console.warn(`\n[nether] ⚠️  Il faut exactement une offre « ${billings[b].title} · ${formats[f].name} ».\n`);
    }
  }
}
