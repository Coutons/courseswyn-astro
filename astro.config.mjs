// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://courseswyn.com',
  output: 'static',
  integrations: [tailwind(), preact(), sitemap()],
});
