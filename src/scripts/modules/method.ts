/**
 * « Du rush au master » (components/home/Method.astro) : la bande suit l'étape lue.
 * L'étape qui passe au milieu de l'écran règle data-level (0 rush → 5 master) ; les transitions sont en CSS.
 * Le compteur descend de 13:23 à 5:40 quand on passe à la sélection.
 * Animations réduites : les états changent sans mouvement. Sans JavaScript : tout reste en état « master ».
 */
import { gsap } from 'gsap';
import { $, $$, prefersReducedMotion, type Cleanup } from '../lib/dom';

interface Stage {
  status: string;
  clock: string;
  fact: string;
}

const toSeconds = (clock: string): number => clock.split(':').reduce((t, part) => t * 60 + Number(part), 0);
const toClock = (s: number): string => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

export function initMethod(): Cleanup {
  const root = $('[data-method]');
  const viz = root && $('[data-method-viz]', root);
  if (!root || !viz) return () => {};

  const steps = $$('[data-step]', root);
  const status = $('[data-method-status]', viz);
  const clock = $('[data-method-clock]', viz);
  const fact = $('[data-method-fact]', viz);
  let stages: Stage[] = [];
  try {
    stages = JSON.parse(viz.dataset.stages ?? '[]') as Stage[];
  } catch {
    return () => {};
  }
  if (steps.length === 0 || stages.length === 0) return () => {};

  const reduce = prefersReducedMotion();
  const counter = { v: toSeconds(stages[0].clock) };
  let level = -1;

  function show(next: number): void {
    if (next === level) return;
    const prev = level;
    level = next;
    const stage = stages[next];
    viz!.dataset.level = String(next);
    steps.forEach((s, i) => s.classList.toggle('is-current', i === next));
    if (status) status.textContent = stage.status;
    if (fact) fact.textContent = stage.fact;
    if (!clock) return;
    const to = toSeconds(stage.clock);
    gsap.killTweensOf(counter);
    if (reduce || prev === -1) {
      counter.v = to;
      clock.textContent = stage.clock;
      return;
    }
    gsap.to(counter, {
      v: to,
      duration: 0.9,
      ease: 'expo.out',
      onUpdate: () => (clock.textContent = toClock(counter.v)),
      onComplete: () => (clock.textContent = stage.clock),
    });
  }

  root.classList.add('is-live');
  show(0);

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) show(Number((entry.target as HTMLElement).dataset.step));
      }
    },
    { rootMargin: '-45% 0px -45% 0px' },
  );
  steps.forEach((s) => io.observe(s));

  return () => {
    io.disconnect();
    gsap.killTweensOf(counter);
  };
}
