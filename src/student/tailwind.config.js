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
          800: '#7c6208',
          900: '#5e4a04',
        },
      },

      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },

      backgroundImage: {
        'navy-gradient': 'linear-gradient(135deg, #0a1628 0%, #1a2f5a 50%, #1e3a6e 100%)',
        'gold-shimmer': 'linear-gradient(90deg, #c9a84c 0%, #f0c040 50%, #d4af37 100%)',
        'hero-gradient': 'linear-gradient(160deg, #060e1a 0%, #0d1f3c 40%, #1a2f5a 70%, #1e3a6e 100%)',
      },

      boxShadow: {
        gold: '0 0 20px rgba(212, 175, 55, 0.3)',
        'gold-lg': '0 0 40px rgba(212, 175, 55, 0.4)',
        navy: '0 4px 24px rgba(10, 22, 40, 0.5)',
        card: '0 2px 16px rgba(10, 22, 40, 0.15)',
      },

      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        shimmer: 'shimmer 2s infinite',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
      },

      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },

        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },

        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },

        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(212,175,55,0.3)' },
          '50%': { boxShadow: '0 0 25px rgba(212,175,55,0.6)' },
        },
      },

    },
  },

  plugins: [],
}