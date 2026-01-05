import starlightPlugin from '@astrojs/starlight-tailwind';

const accent = {
  200: '#99f0e4',
  600: '#0d9488',
  900: '#134e4a',
  950: '#0a3532',
};

const gray = {
  100: '#f4f4f5',
  200: '#e4e4e7',
  300: '#d4d4d8',
  400: '#a1a1aa',
  500: '#71717a',
  700: '#3f3f46',
  800: '#27272a',
  900: '#18181b',
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        accent,
        gray,
        primary: {
          DEFAULT: '#14b8a6',
          foreground: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [starlightPlugin()],
};
