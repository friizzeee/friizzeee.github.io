// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // ⚠️ Remplacez par l'adresse définitive du site une fois en ligne
  // (sert au sitemap, aux balises de partage et à l'URL canonique).
  site: 'https://friizzeee.github.io',

  // Les liens sont préchargés au survol : la page Contact s'ouvre instantanément.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },

  // Polices hébergées avec le site (téléchargées au build, aucun appel externe pour le visiteur).
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Geist',
      cssVariable: '--font-geist',
      weights: ['100 900'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['sans-serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Geist Mono',
      cssVariable: '--font-geist-mono',
      weights: ['400', '500'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['monospace'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Instrument Serif',
      cssVariable: '--font-instrument',
      weights: ['400'],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['serif'],
    },
  ],

  // Miniatures YouTube du portfolio : téléchargées et optimisées au build (aucun appel à YouTube pour le visiteur).
  image: {
    domains: ['i.ytimg.com'],
  },

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [sitemap()],
});
