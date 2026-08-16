// @ts-check
// Force WIB (Asia/Jakarta, UTC+7) for all date rendering — cross-platform
// replacement for `set TZ=Asia/Jakarta` in npm scripts (Windows-only syntax).
process.env.TZ = 'Asia/Jakarta';

import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import mdx from '@astrojs/mdx';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  image: {
    remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }]
  },
  integrations: [react(), mdx()],
  site: 'https://courseswyn.com',
  base: '/'
});
