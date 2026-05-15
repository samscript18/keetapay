import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './features/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#07090d',
        foreground: '#f7fbff',
        muted: '#8d98a8',
        border: 'rgba(255,255,255,0.12)',
        card: 'rgba(255,255,255,0.07)',
        accent: '#27f19a',
        coral: '#ff6f61',
        sky: '#65d7ff'
      },
      boxShadow: {
        glow: '0 0 60px rgba(39, 241, 154, .22)'
      },
      animation: {
        marquee: 'marquee 32s linear infinite'
      },
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' }
        }
      }
    },
  },
  plugins: [],
};

export default config;
