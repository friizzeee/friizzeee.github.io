/**
 * En-tête (components/layout/Header.astro) :
 *  - la pastille crème glisse vers la section affichée (sections de l'accueil marquées data-spy) ;
 *  - transparent au-dessus du plan-séquence, fond sombre ailleurs ;
 *  - menu plein écran (téléphone, tablette) ;
 *  - les liens vers une ancre de la page défilent en douceur.
 */
import { $, $$, listen, type Cleanup } from '../lib/dom';
import { smooth } from '../lib/smooth';

export function initHeader(): Cleanup {
  const header = $('[data-header]');
  if (!header) return () => {};
  const cleanups: Cleanup[] = [];
  const pills = $('[data-pills]', header);
  const links = $$('[data-spy-link]', header);
  let current = links.find((a) => a.classList.contains('is-on')) ?? null;

  /* ── La pastille ── */
  function place(link: HTMLElement | null, instant = false): void {
    links.forEach((a) => a.classList.toggle('is-on', a === link));
    if (!pills) return;
    if (instant) pills.style.setProperty('transition', 'none');
    const inPills = link && pills.contains(link);
    const left = inPills ? link.offsetLeft : 0;
    const right = inPills ? link.offsetLeft + link.offsetWidth : 0;
    pills.style.setProperty('--pill-l', `${left}px`);
    pills.style.setProperty('--pill-r', `${right}px`);
    if (instant) requestAnimationFrame(() => pills.style.removeProperty('transition'));
  }
  place(current, true);
  document.fonts?.ready.then(() => place(current, true));
  cleanups.push(listen(window, 'resize', () => place(current, true)));

  const sections = $$('[data-spy]');
  if (sections.length > 0) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = (entry.target as HTMLElement).dataset.spy;
          const link = links.find((a) => a.dataset.spyLink === id) ?? null;
          if (link !== current) {
            current = link;
            place(current);
          }
        }
      },
      { rootMargin: '-50% 0px -50% 0px' },
    );
    sections.forEach((s) => io.observe(s));
    cleanups.push(() => io.disconnect());
  }

  /* ── Le fond ── */
  const take = $('[data-take]');
  let ticking = false;
  const updateBar = (): void => {
    ticking = false;
    const overTake = take ? take.getBoundingClientRect().bottom > header.offsetHeight : false;
    header.classList.toggle('is-solid', scrollY > 8 && !overTake);
  };
  updateBar();
  cleanups.push(
    listen(
      window,
      'scroll',
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(updateBar);
        }
      },
      { passive: true },
    ),
  );

  /* ── Le menu ── */
  const menu = $<HTMLDialogElement>('[data-menu]');
  const openBtn = $('[data-menu-open]', header);
  if (menu && openBtn) {
    const close = (): void => {
      if (menu.open) menu.close();
    };
    cleanups.push(
      listen(openBtn, 'click', () => {
        menu.showModal();
        openBtn.setAttribute('aria-expanded', 'true');
        smooth.stop();
      }),
      listen(menu, 'close', () => {
        openBtn.setAttribute('aria-expanded', 'false');
        smooth.start();
      }),
      listen(menu, 'click', (e) => {
        const target = e.target as Element;
        if (target.closest('[data-menu-close], [data-menu-link]')) close();
      }),
    );
  }

  /* ── Ancres de la page courante : défilement doux ── */
  cleanups.push(
    listen(document, 'click', (e) => {
      const event = e as MouseEvent;
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      const a = (event.target as Element).closest<HTMLAnchorElement>('a[href*="#"]');
      if (!a || a.target === '_blank') return;
      const url = new URL(a.href, location.href);
      if (url.pathname !== location.pathname || !url.hash) return;
      const target = url.hash === '#top' ? document.body : document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target) return;
      event.preventDefault();
      smooth.scrollTo(url.hash === '#top' ? 0 : target);
      history.replaceState(null, '', url.hash === '#top' ? location.pathname : url.hash);
    }),
  );

  return () => cleanups.forEach((fn) => fn());
}
