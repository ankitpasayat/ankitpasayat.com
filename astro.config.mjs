import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://ankitpasayat.com',
  integrations: [sitemap()],
  build: {
    // every page self-contained: zero extra CSS requests
    inlineStylesheets: 'always',
  },
});
