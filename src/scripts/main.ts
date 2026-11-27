/**
 * Point d'entrée unique des scripts du site.
 * Chaque page est un vrai chargement (le changement de page est un fondu au noir géré par le navigateur,
 * voir @view-transition dans global.css) : chaque module s'initialise une fois et ne trouve rien à faire
 * si sa section n'est pas sur la page.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import type { Cleanup } from './lib/dom';
import { initSmoothScroll } from './lib/smooth';
import { initHeader } from './modules/header';
import { initTake } from './modules/take';
import { initMethod } from './modules/method';
import { initRates } from './modules/rates';
import { initWorks } from './modules/works';
import { initReveal } from './modules/reveal';
import { initCopy } from './modules/copy';
import { setupPlayer } from './modules/player';

gsap.registerPlugin(ScrollTrigger);
gsap.config({ nullTargetWarn: false });

initSmoothScroll();

const cleanups: Cleanup[] = [];
// Les promos expirées disparaissent d'abord : rien ne doit s'animer sur un prix qui n'existe plus.
cleanups.push(initRates(), initHeader(), initTake(), initMethod(), initWorks(), initReveal(), initCopy());
setupPlayer(cleanups);

requestAnimationFrame(() => ScrollTrigger.refresh());
// Les polices changent la hauteur des textes : on recalcule les déclencheurs une fois chargées.
document.fonts?.ready.then(() => ScrollTrigger.refresh());
