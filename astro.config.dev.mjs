// @ts-check
// Force WIB (Asia/Jakarta, UTC+7) for all date rendering — cross-platform
// replacement for `set TZ=Asia/Jakarta` in npm scripts (Windows-only syntax).
process.env.TZ = 'Asia/Jakarta';

import path from 'node:path';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import mdx from '@astrojs/mdx';

// Admin menyimpan coupon dengan menulis langsung ke src/data/coupons.json.
// File itu ikut masuk module graph Vite (diimport CouponGrid), jadi setiap
// save memicu "full-reload" ke browser. Reload itu membatalkan redirect
// kembali ke /admin sesudah update. Invalidasi modulnya (biar refresh manual
// tetap dapat data baru) tapi jangan kirim update HMR ke halaman admin.
function quietCouponWrites() {
  const target = path.join(process.cwd(), 'src', 'data', 'coupons.json');
  return {
    name: 'courseswyn:quiet-coupon-writes',
    apply: 'serve',
    handleHotUpdate({ file, server, modules }) {
      if (path.resolve(file) !== target) return;
      for (const mod of modules) server.moduleGraph.invalidateModule(mod);
      return [];
    },
  };
}

// Admin menyimpan blog dengan menulis ke src/content/**. Content layer Astro
// lalu mengirim full-reload ke semua client, yang bisa membatalkan redirect
// ke /admin/blog sesudah save. API admin menandai window singkat lewat global
// ini; selama window itu, file content di-invalidate tanpa dikirim update HMR.
function quietAdminContentReloads() {
  const contentDir = path.join(process.cwd(), 'src', 'content') + path.sep;
  // process.env dipakai (bukan globalThis) karena API route dieksekusi di
  // module runner Vite yang bisa punya context global berbeda.
  const isQuiet = () => Date.now() < Number(process.env.__CW_QUIET_CONTENT_RELOAD_UNTIL ?? 0);
  return {
    name: 'courseswyn:quiet-admin-content-reloads',
    apply: 'serve',
    hotUpdate: {
      order: 'pre',
      handler({ file, modules }) {
        if (!isQuiet()) return;
        if (!path.resolve(file).startsWith(contentDir)) return;
        for (const mod of modules) this.environment.moduleGraph.invalidateModule(mod);
        return [];
      },
    },
    configureServer(server) {
      const hot = server.environments?.client?.hot;
      if (!hot) return;
      const send = hot.send.bind(hot);
      hot.send = (payload, ...rest) => {
        if (payload?.type === 'full-reload' && payload.path === '*' && isQuiet()) return;
        return send(payload, ...rest);
      };
    },
  };
}

export default defineConfig({
  vite: {
    plugins: [quietCouponWrites(), quietAdminContentReloads()],
  },
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  image: {
    remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }]
  },
  integrations: [react(), mdx()],
  site: 'https://courseswyn.com',
  base: '/'
});
