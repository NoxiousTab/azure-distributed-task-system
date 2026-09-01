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
        // Category accent colors - used sparingly (icon chips only), the
        // cobalt accent above stays the one true brand/CTA color throughout.
        convert: '#1F7A67',
        'convert-bg': '#DCEEE7',
        ocr: '#B4791F',
        'ocr-bg': '#F3E6CE',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      keyframes: {
        stubIn: {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'stub-in': 'stubIn 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
        'float-slow': 'floatSlow 5s ease-in-out infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
