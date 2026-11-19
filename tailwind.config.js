/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: { 950: '#0a0807', 900: '#100d0b', 800: '#17120f', 700: '#211a15', 600: '#2d241c' },
        gold: { 200: '#e9d9a6', 300: '#d9c27a', 400: '#c0a15a', 500: '#a8863f', 600: '#86692d', 700: '#5e4a20' },
        blood: { 400: '#b83a3a', 500: '#8f1f1f', 600: '#6e1414', 700: '#4a0c0c' },
        parch: '#cdbf9f',
      },
      fontFamily: {
        display: ['"Cinzel"', 'Georgia', 'serif'],
        body: ['"Crimson Pro"', 'Georgia', 'serif'],
        ui: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        rune: '0 0 0 1px rgba(168,134,63,.35), 0 0 24px rgba(143,31,31,.18) inset',
        glow: '0 0 18px rgba(192,161,90,.35)',
      },
    },
  },
  plugins: [],
};
