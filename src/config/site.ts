/**
 * ─────────────────────────────────────────────────────────────
 *  CONFIGURATION PRINCIPALE DU SITE
 *  C'est le fichier à modifier en premier : nom, lien Discord,
 *  textes du hero, référencement.
 * ─────────────────────────────────────────────────────────────
 */

export const site = {
  /** Nom ou marque affiché partout (logo, titres, pied de page). */
  name: 'nether',

  /** Ce que vous faites, en quelques mots (balise title, SEO, JSON-LD). */
  role: 'Monteur vidéo freelance',

  /**
   * Contact Discord : le moyen de contact principal du site.
   * - url    : votre lien Discord, par ex. https://discord.com/users/123456789
   *            ou une invitation https://discord.gg/xxxxxx
   * - handle : votre pseudo Discord (facultatif). S'il est renseigné, un bouton
   *            « copier le pseudo » apparaît sur la page Contact.
   */
  discord: {
    url: 'https://discord.com/users/1570838778132693044',
    handle: 'frizze_1d',
  },

  /** Adresse e-mail de contact (affichée sur la page Contact et dans le pied de page). */
  email: 'nether.1support@gmail.com',

  /** Petit badge « disponible » dans l'en-tête. Passez show à false pour le masquer. */
  availability: {
    show: true,
    label: 'Ouvert aux nouveaux projets',
  },

  /**
   * Titre principal de la page d'accueil, une ligne par entrée.
   * Entourez un passage d'astérisques pour le passer en italique serif : *Watch time*
   * Le point final de la dernière ligne devient le point rouge « REC ».
   */
  heroTitle: ['Raw footage in.', '*Watch time* out.'],

  /** Sous-titre du hero, sous le grand titre. */
  heroLead:
    'Monteur vidéo pour créateurs YouTube, TikTok et Instagram. Ma spécialité : les vidéos longues de 10 minutes et plus, montées pour que le public reste jusqu’au bout.',

  /** Référencement et partage sur les réseaux. */
  seo: {
    title: 'nether — Monteur vidéo freelance · YouTube, TikTok, Reels',
    description:
      'Montage vidéo pour créateurs de contenu : vidéos YouTube longues (10 min et plus), TikTok et Reels Instagram, réglées en une fois ou en fin de mois. Gaming, business, finance, crypto, storytelling.',
    ogImage: '/og.jpg',
  },
} as const;

/* ── Helpers Discord (rien à modifier ci-dessous) ─────────────── */

export const isDiscordConfigured = /^https:\/\//.test(site.discord.url);

/** Lien utilisé par tous les boutons Discord du site. */
export const discordHref = isDiscordConfigured ? site.discord.url : '#lien-discord-a-configurer';

if (!isDiscordConfigured) {
  console.warn(
    '\n[nether] ⚠️  Lien Discord non configuré : remplacez [DISCORD_LINK] dans src/config/site.ts\n',
  );
}
