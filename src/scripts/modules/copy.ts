/**
 * Boutons « copier » : <button data-copy="texte"> ou
 * <button data-copy data-copy-from="#id-du-bloc">.
 * Le libellé [data-copy-label] affiche « Copié » pendant 2 secondes.
 */
import { listen, type Cleanup } from '../lib/dom';

export function initCopy(): Cleanup {
  const timers = new Map<HTMLElement, number>();

  const off = listen(document, 'click', async (event) => {
    const btn = (event.target as Element | null)?.closest?.('[data-copy]') as HTMLElement | null;
    if (!btn) return;

    const from = btn.dataset.copyFrom;
    const text = (from ? document.querySelector(from)?.textContent : btn.dataset.copy) ?? '';
    if (!text.trim()) return;

    try {
      await navigator.clipboard.writeText(text.trim());
    } catch {
      return;
    }

    const label = btn.querySelector<HTMLElement>('[data-copy-label]');
    const original = label?.dataset.original ?? label?.textContent ?? '';
    if (label) {
      label.dataset.original = original;
      label.textContent = 'Copié !';
    }
    btn.dataset.copied = '';

    window.clearTimeout(timers.get(btn));
    timers.set(
      btn,
      window.setTimeout(() => {
        if (label) label.textContent = original;
        delete btn.dataset.copied;
      }, 2000),
    );
  });

  return () => {
    off();
    timers.forEach((id) => window.clearTimeout(id));
  };
}
