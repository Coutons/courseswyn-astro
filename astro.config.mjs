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
  // Slug instruktur lama (dulu ü → hilang, mis. schwarzmller) dialihkan ke
  // slug baru yang ditransliterasi dengan benar (schwarzmuller).
  redirects: {
    '/instructor/maximilian-schwarzmller': '/instructor/maximilian-schwarzmuller',
    '/instructor/academind-by-maximilian-schwarzmller': '/instructor/academind-by-maximilian-schwarzmuller',
    '/instructor/santiago-hernndez': '/instructor/santiago-hernandez',
    '/instructor/felipe-gaviln': '/instructor/felipe-gavilan',
    '/instructor/lauro-fialho-mller': '/instructor/lauro-fialho-muller',
    '/instructor/andrs-guzmn': '/instructor/andres-guzman',
    '/instructor/gastn-galarza': '/instructor/gaston-galarza',
    '/instructor/gustavo-escobar-henrquez': '/instructor/gustavo-escobar-henriquez',
    '/instructor/ivan-loureno-gomes': '/instructor/ivan-lourenco-gomes',
    '/instructor/jnis-smilga': '/instructor/janis-smilga',
    '/instructor/mihai-ctlin-teodosiu': '/instructor/mihai-catalin-teodosiu',
    '/instructor/mislav-majdandi': '/instructor/mislav-majdandzic',
  },
  image: {
    remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }]
  },
  integrations: [react(), sitemap({
    filter: (page) => {
      if (page.includes('/admin/')) return false;
      if (page.includes('/api/')) return false;
      // Exclude paginated pages that are noindex (avoid Submitted URL marked noindex)
      if (/\/udemy-coupon-code\/\d+\/?$/.test(page)) return false;
      if (page.includes('?page=')) return false;
      if (/\/blog\/page\//.test(page)) return false;
      return true;
    }
  }), mdx()],
  site: 'https://courseswyn.com',
  base: '/'
});
