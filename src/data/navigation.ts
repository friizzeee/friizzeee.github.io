/**
 * Liens du menu principal. Les ancres (#services…) correspondent aux `id`
 * des sections de la page d'accueil.
 */

export interface NavItem {
  label: string;
  href: string;
  /** id de la section ciblée (sert à surligner le lien actif). */
  section: string;
}

export const navigation: NavItem[] = [
  { label: 'Accueil', href: '/#top', section: 'top' },
  { label: 'Services', href: '/#services', section: 'services' },
  { label: 'Portfolio', href: '/portfolio', section: 'portfolio' },
  { label: 'À propos', href: '/#about', section: 'about' },
  { label: 'Offres', href: '/#offres', section: 'offres' },
];

export const contactNav = { label: 'Contact', href: '/contact' };
