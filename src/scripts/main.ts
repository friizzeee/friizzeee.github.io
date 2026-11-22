/**
 * Point d'entrée unique du moteur d'animation.
 *
 * Cycle de vie (pages chargées sans rechargement grâce au ClientRouter d'Astro) :
 *  - astro:page-load   → on monte les animations de la page affichée
 *  - astro:before-swap → on démonte tout (ScrollTriggers, écouteurs, SplitText)
 * Un seul point de montage/démontage : pas d'animations en double ni de fuite mémoire.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

import type { Cleanup } from './lib/dom';
import { initSmoothScroll, smooth } from './lib/smooth';
import { initChrome } from './modules/chrome';
import { initEffects } from './modules/effects';
import { initHero } from './modules/hero';
import { initPortfolio } from './modules/portfolio';
import { initCopy } from './modules/copy';
import { initCoulisses } from './modules/coulisses';
import { initOffers } from './modules/offers';
import { initPageCut, revealAfterCut } from './modules/cut';
import { playIntro } from './modules/intro';

gsap.registerPlugin(ScrollTrigger, SplitText);
gsap.config({ nullTargetWarn: false });

/** Classes de <html> à conserver d'une page à l'autre (Astro remplace les attributs de <html>). */
const PERSISTENT_CLASSES = ['js', 'motion-ready', 'lenis', 'lenis-smooth'];

let cleanups: Cleanup[] = [];
let isFirstLoad = true;

initSmoothScroll();
initPageCut();

document.addEventListener('astro:page-load', () => {
  document.documentElement.classList.add('motion-ready');
  smooth.resize();
  smooth.start();

  const entrance = isFirstLoad ? playIntro() : revealAfterCut();
  isFirstLoad = false;

  // initOffers d'abord : il retire les promos expirées avant que les compteurs de prix ne se branchent.
  cleanups.push(initChrome(), initOffers(), initEffects(), initPortfolio(), initCopy(), initHero(entrance), initCoulisses());

  requestAnimationFrame(() => ScrollTrigger.refresh());
});

document.addEventListener('astro:before-swap', (event) => {
  cleanups.forEach((fn) => fn());
  cleanups = [];

  const { newDocument } = event as Event & { newDocument: Document };
  const current = document.documentElement.classList;
  for (const name of PERSISTENT_CLASSES) {
    if (current.contains(name)) newDocument.documentElement.classList.add(name);
  }
});

// Les polices modifient la hauteur des textes : on recalcule les déclencheurs une fois chargées.
document.fonts?.ready.then(() => ScrollTrigger.refresh());
