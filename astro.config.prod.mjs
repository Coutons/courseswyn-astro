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
    // Kategori Spanyol yang dinormalisasi ke Inggris (migrasi coupons.json).
    '/categories/desarrollo': '/categories/development',
    '/categories/informtica-y-software': '/categories/it-and-software',
    '/categories/negocios': '/categories/business',
    '/categories/productividad-en-la-oficina': '/categories/office-productivity',
    // Topik Spanyol (dulu dari tags/subcategory ES) ke topik Inggris.
    '/topics/desarrollo-web': '/topics/web-development',
    '/topics/certificaciones-de-informtica': '/topics/it-certifications',
    '/topics/lenguajes-de-programacin': '/topics/programming-languages',
    '/topics/desarrollo-sin-cdigo': '/topics/no-code-development',
    '/topics/desarrollo-mvil': '/topics/mobile-development',
    '/topics/inteligencia-artificial-ia': '/topics/artificial-intelligence-ai',
    '/topics/herramientas-de-desarrollo-de-software': '/topics/software-development-tools',
    '/topics/ingeniera-de-software': '/topics/software-engineering',
    '/topics/ciberseguridad': '/topics/cybersecurity',
    '/topics/redes-y-seguridad': '/topics/network-security',
    '/topics/analtica-e-inteligencia-empresarial': '/topics/business-analytics-intelligence',
    '/topics/inteligencia-de-fuentes-abiertas-osint': '/topics/ethical-hacking',
    '/topics/hacking-tico': '/topics/ethical-hacking',
    '/topics/hacking-con-python': '/topics/ethical-hacking',
    '/topics/aprendizaje-automtico': '/topics/machine-learning',
    '/topics/aprendizaje-profundo': '/topics/deep-learning',
    '/topics/diseo-y-desarrollo-de-bases-de-datos': '/topics/database-design-development',
    '/topics/ia-generativa-genai': '/topics/generative-ai-genai',
    '/topics/bases-de-datos-vectorial': '/topics/generative-ai-genai',
    '/topics/google-gemini-bard': '/topics/google-gemini',
    '/topics/ciencias-de-la-informacin': '/topics/ai-agents-agentic-ai',
    '/topics/informtica-y-software': '/topics/it-software',
    '/topics/informtica-y-software-otros': '/topics/it-software',
    '/topics/gestin-de-proyectos': '/topics/project-management',
    '/topics/agentes-de-ia-e-ia-agntica': '/topics/ai-agents-agentic-ai',
    '/topics/ia-e-ia-agntica': '/topics/ai-agents-agentic-ai',
    '/topics/c-lenguaje-de-programacin': '/topics/c-programming-language',
    '/topics/dart-lenguaje-de-programacin': '/topics/programming-languages',
    '/topics/go-lenguaje-de-programacin': '/topics/programming-languages',
    '/topics/php-lenguaje-de-programacin': '/topics/php',
    '/topics/patrones-de-diseo-software': '/topics/software-engineering',
    '/topics/diseo-de-aplicaciones-mviles': '/topics/mobile-app-development',
    '/topics/generacin-aumentada-por-recuperacin-rag': '/topics/retrieval-augmented-generation-rag',
    '/topics/computacin-en-la-nube': '/topics/cloud-computing',
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
