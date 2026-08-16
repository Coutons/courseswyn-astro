// @ts-check
// Force WIB (Asia/Jakarta, UTC+7) for all date rendering — cross-platform
// replacement for `set TZ=Asia/Jakarta` in npm scripts (Windows-only syntax).
process.env.TZ = 'Asia/Jakarta';

import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  output: 'static',
  image: {
    remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }]
  },
  integrations: [react(), sitemap({
    filter: (page) => {
      if (page.includes('/admin/')) return false;
      if (page.includes('/api/')) return false;
      return true;
    }
  }), mdx()],
  site: 'https://courseswyn.com',
  base: '/'
});
