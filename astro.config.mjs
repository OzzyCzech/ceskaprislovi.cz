import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://ceskaprislovi.cz',
  trailingSlash: 'never',
  redirects: { '/nema-prachu-neudatny': '/nema-prachu-zbabely' },
  // GitHub Pages redirects `/slug` to `/slug/` when the page is a directory; `slug.html` is served without a redirect.
  build: { format: 'file' },
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
});
