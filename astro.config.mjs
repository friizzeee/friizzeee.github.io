// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // ⚠️ Remplacez par l'adresse définitive du site une fois en ligne
  // (sert au sitemap, aux balises de partage et à l'URL canonique).
  site: 'https://friizzeee.github.io',

  // Les liens sont préchargés au survol : les pages s'ouvrent instantanément.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },

  // Les polices (Archivo, Corinthia) sont hébergées avec le site : public/fonts/, déclarées dans src/styles/global.css.

  // Miniatures YouTube du portfolio : téléchargées et optimisées au build (aucun appel à YouTube pour le visiteur).
  image: {
    domains: ['i.ytimg.com'],
  },

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [sitemap()],
});
