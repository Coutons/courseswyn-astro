// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import node from '@astrojs/node';

import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  integrations: [react(), sitemap(), mdx(), tailwind()],
  site: 'https://courseswyn.com',
  base: '/'
});