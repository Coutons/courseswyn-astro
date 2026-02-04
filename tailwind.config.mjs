import tailwindcssAnimated from 'tailwindcss-animated';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        mint: {
          300: '#8CFFD8',
          400: '#5CFFDD',
          500: '#2FFFD8',
          600: '#14D7B2',
        },
        midnight: '#020617',
        surface: '#080C20',
        card: '#0F162E',
        accent: '#44FFC4',
      },
      boxShadow: {
        glow: '0 0 30px rgba(47, 255, 216, 0.35)',
      },
      backgroundImage: {
        'grid-mesh':
          'radial-gradient(circle at 1px 1px, rgba(79, 255, 210, 0.35) 1px, transparent 0)',
      },
    },
  },
  plugins: [tailwindcssAnimated],
};
