// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import remarkToc from 'remark-toc';

export default defineConfig({
  site: 'https://courseswyn.com',
  output: 'static',
  integrations: [
    tailwind(),
    preact(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.8,
      entryLimit: 5000,
      lastmod: new Date()
    })
  ],
  markdown: {
    remarkPlugins: [
      [remarkToc, {
        heading: 'Table of Contents',
        maxDepth: 3,
        tight: true
      }]
    ]
  },
  experimental: {
    svgo: true
  }
});
