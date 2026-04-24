// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  output: 'static',
  integrations: [react(), sitemap()],
  site: 'https://courseswyn.com',
  base: '/'
});