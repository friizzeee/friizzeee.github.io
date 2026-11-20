/**
 * Intro de première visite : timecode qui défile puis ouverture « bandes cinéma ».
 * Renvoie une promesse résolue au moment où le hero peut commencer à apparaître.
 */
import { gsap } from 'gsap';
import { $, $$, toTimecode } from '../lib/dom';
import { smooth } from '../lib/smooth';

export function playIntro(): Promise<void> {
  const html = document.documentElement;
  const root = $('[data-intro]');

  if (!html.classList.contains('intro') || !root) return Promise.resolve();

  try {
    sessionStorage.setItem('nether:intro', '1');
  } catch {
    /* navigation privée : l'intro rejouera, ce n'est pas grave */
  }

  const bars = $$('[data-intro-bar]', root);
  const center = $('[data-intro-center]', root);
  const line = $('[data-intro-line]', root);
  const tc = $('[data-intro-tc]', root);
  const counter = { seconds: 0 };

  smooth.stop();

  return new Promise((resolve) => {
    const tl = gsap.timeline({
      onComplete: () => {
        html.classList.remove('intro');
        gsap.set([...bars, center, line], { clearProps: 'all' });
        smooth.start();
        resolve();
      },
    });

    tl.to(line, { scaleX: 1, duration: 0.8, ease: 'power2.inOut' }, 0)
      .to(
        counter,
        {
          seconds: 1.48,
          duration: 0.8,
          ease: 'power1.in',
          onUpdate: () => {
            if (tc) tc.textContent = toTimecode(counter.seconds);
          },
        },
        0,
      )
      .to(center, { autoAlpha: 0, y: -14, duration: 0.3, ease: 'power2.in' }, 0.85)
      .to(bars, { yPercent: (i: number) => (i === 0 ? -100 : 100), duration: 0.9, ease: 'expo.inOut' }, 0.95)
      // Le hero démarre pendant que les bandes s'ouvrent.
      .call(() => resolve(), [], 1.15);
  });
}
