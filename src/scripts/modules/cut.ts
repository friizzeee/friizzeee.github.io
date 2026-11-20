/**
 * Transitions entre pages.
 *  - Par défaut, une « coupe de montage » : un volet couvre l'écran pendant le chargement de la page
 *    suivante, avec le nom de la destination, puis se retire vers le haut.
 *  - D'une carte de projet ([data-morph]) vers sa page : pas de volet. L'image de la carte se transporte
 *    jusqu'à sa place dans la page du projet ([data-morph-target]), grâce aux View Transitions du navigateur.
 *    Le nom de transition n'est posé que pour ce trajet : aucune autre navigation n'en hérite.
 */
import { gsap } from 'gsap';
import { $, prefersReducedMotion, toTimecode } from '../lib/dom';
import { smooth } from '../lib/smooth';

const PAGE_LABELS: Record<string, string> = {
  '/': 'Accueil',
  '/contact': 'Contact',
  '/portfolio': 'Portfolio',
};

const SECTION_LABELS: Record<string, string> = {
  '#top': 'Accueil',
  '#services': 'Services',
  '#portfolio': 'Portfolio',
  '#about': 'À propos',
  '#offres': 'Offres',
};

/** Nom de la transition qui relie l'image de la carte à celle de la page projet (styles : global.css). */
const MORPH_NAME = 'project-media';

let isCovering = false;
let isMorphing = false;

/** Nom affiché sur le volet : celui du lien (data-cut-label), sinon celui de la section ou de la page. */
function labelFor(url: URL, source: Element | null): string {
  const custom = source?.closest<HTMLElement>('[data-cut-label]')?.dataset.cutLabel;
  if (custom) return custom;
  const fromHash = SECTION_LABELS[url.hash];
  if (fromHash) return fromHash;
  const path = url.pathname.replace(/\/$/, '') || '/';
  if (path.startsWith('/portfolio/')) return 'Projet';
  return PAGE_LABELS[path] ?? 'nether';
}

function parts() {
  const root = $('[data-cut]');
  return {
    root,
    panel: root ? $('[data-cut-panel]', root) : null,
    title: root ? $('[data-cut-title]', root) : null,
    label: root ? $('.cut__label', root) : null,
  };
}

function cover(label: string): Promise<void> {
  const { root, panel, title, label: labelEl } = parts();
  if (!root || !panel) return Promise.resolve();

  isCovering = true;
  if (title) title.textContent = label;
  smooth.stop();

  const bar = root.querySelector<HTMLElement>('[data-cut-bar]');
  const tc = root.querySelector<HTMLElement>('[data-cut-tc]');
  const clock = { s: 0 };

  return new Promise((resolve) => {
    gsap
      .timeline({ onComplete: resolve })
      .set(root, { visibility: 'visible' })
      .set(bar, { scaleX: 0 })
      .fromTo(panel, { yPercent: 100 }, { yPercent: 0, duration: 0.6, ease: 'expo.inOut' })
      .fromTo(labelEl, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, ease: 'expo.out' }, 0.3)
      // La barre se remplit et le timecode défile pendant le chargement de la page suivante
      .to(bar, { scaleX: 0.85, duration: 0.5, ease: 'power2.out' }, 0.32)
      .to(
        clock,
        {
          s: 0.6,
          duration: 0.5,
          ease: 'none',
          onUpdate: () => {
            if (tc) tc.textContent = toTimecode(clock.s);
          },
        },
        0.32,
      );
  });
}

/** Retire le volet après l'affichage de la nouvelle page. */
export function revealAfterCut(): Promise<void> {
  const { root, panel, label } = parts();
  if (!isCovering || !root || !panel) return Promise.resolve();
  isCovering = false;

  return new Promise((resolve) => {
    gsap
      .timeline({
        onComplete: () => {
          gsap.set(root, { visibility: 'hidden' });
          gsap.set(panel, { yPercent: 100 });
        },
      })
      .to(root.querySelector('[data-cut-bar]'), { scaleX: 1, duration: 0.2, ease: 'power2.out' })
      .to(label, { y: -20, autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, 0.12)
      .to(panel, { yPercent: -100, duration: 0.8, ease: 'expo.inOut' }, 0.1)
      // Le contenu commence à apparaître pendant que le volet remonte.
      .call(() => resolve(), [], 0.45);
  });
}

const canMorph = (): boolean => 'startViewTransition' in document && !prefersReducedMotion();

/** Retire les noms de transition posés lors d'un trajet précédent. */
function clearMorph(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-morph-media], [data-morph-target]').forEach((el) => {
    el.style.removeProperty('view-transition-name');
  });
}

export function initPageCut(): void {
  document.addEventListener('astro:before-preparation', (event) => {
    const e = event as Event & { to: URL; loader: () => Promise<void>; sourceElement?: Element };
    const source = e.sourceElement ?? null;
    clearMorph(document);
    isMorphing = false;

    // Carte de projet → page du projet : l'image se transporte, sans volet.
    const media = source?.closest('[data-morph]')
      ? source.closest('[data-project]')?.querySelector<HTMLElement>('[data-morph-media]')
      : null;
    if (media && canMorph() && e.to.pathname.startsWith('/portfolio/')) {
      media.style.setProperty('view-transition-name', MORPH_NAME);
      isMorphing = true;
      return;
    }

    if (prefersReducedMotion()) return;
    const load = e.loader;
    e.loader = async () => {
      await Promise.all([cover(labelFor(e.to, source)), load()]);
    };
  });

  // La page d'arrivée reçoit le même nom sur son image, juste avant d'être affichée.
  document.addEventListener('astro:before-swap', (event) => {
    if (!isMorphing) return;
    const { newDocument } = event as Event & { newDocument: Document };
    newDocument.querySelector<HTMLElement>('[data-morph-target]')?.style.setProperty('view-transition-name', MORPH_NAME);
  });
}
