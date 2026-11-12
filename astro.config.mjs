import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://ceskaprislovi.cz',
  trailingSlash: 'never',
  // Astro 7 defaults to JSX-style whitespace (compressHTML: 'jsx'), which drops the space between adjacent inline elements.
  compressHTML: true,
  // GitHub Pages redirects `/slug` to `/slug/` when the page is a directory; `slug.html` is served without a redirect.
  build: { format: 'file' },
  // Punctuation-only duplicates: keep the canonical URLs already chosen by Google.
  // On GitHub Pages, Astro emits an immediate meta refresh and a canonical link.
  redirects: {
    '/dat-mi-ho-pan-buh-na-harc-9cfba67bbff2': '/dat-mi-ho-pan-buh-na-harc',
    '/drz-pane-boze-kary-at-se-vuz-nezvrati-0bfa1ea73582': '/drz-pane-boze-kary-at-se-vuz-nezvrati',
  },
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
});
