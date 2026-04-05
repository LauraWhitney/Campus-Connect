/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#e8edf5',
          100: '#c5d0e6',
          200: '#9db0d4',
          300: '#7490c2',
          400: '#5277b5',
          500: '#2f5ea8',
          600: '#1e3a6e',
          700: '#1a2f5a',
          800: '#0d1f3c',
          900: '#0a1628',
          950: '#060e1a',
        },
        gold: {
          50:  '#fffbea',
          100: '#fff3c4',
          200: '#ffe685',
          300: '#f0c040',
          400: '#d4af37',
          500: '#c9a84c',
          600: '#b8941a',
          700: '#9a7b0e',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        gold:   '0 0 20px rgba(212,175,55,0.3)',
        navy:   '0 4px 24px rgba(10,22,40,0.5)',
        card:   '0 2px 16px rgba(10,22,40,0.15)',
      },
      animation: {
        'fade-in':  'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.35s ease-out forwards',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(14px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
