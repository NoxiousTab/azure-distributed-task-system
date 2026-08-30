/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F2F3EC',
        panel: '#E8EAE1',
        'panel-2': '#DEE1D4',
        ink: '#14171A',
        muted: '#63675E',
        line: '#C9CCC0',
        accent: '#2A46E8',
        'accent-ink': '#12235C',
        'accent-bg': '#DDE3FB',
        stamp: '#C23B2E',
        'stamp-bg': '#F5DEDA',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
