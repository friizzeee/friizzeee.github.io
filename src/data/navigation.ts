/**
 * Menu principal : les pastilles en haut à gauche.
 * `section` : id de la section de l'accueil qui allume la pastille pendant le défilement,
 * ou nom de la page (« realisations » pour /portfolio et les pages projet).
 */

export interface NavItem {
  label: string;
  href: string;
  section: string;
}

export const navigation: NavItem[] = [
  { label: 'Accueil', href: '/', section: 'top' },
  { label: 'Réalisations', href: '/portfolio', section: 'realisations' },
  { label: 'Méthode', href: '/#methode', section: 'methode' },
  { label: 'Tarifs', href: '/#tarifs', section: 'tarifs' },
];

export const contactNav = { label: 'Contact', href: '/contact' };
