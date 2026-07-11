/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── CUEA brand palette ──────────────────────────
        // Maroon (#A0002A) is CUEA's official site theme-color; gold pairs
        // with it for the classic Catholic-university crest look.
        //
        // `indigo` and `violet` are overridden (not just `primary`/
        // `secondary`) because most of the app's existing markup uses the
        // literal Tailwind palette names directly (bg-indigo-500,
        // text-violet-300, etc.) rather than the custom tokens below — this
        // way every one of those classes is re-themed for free.
        primary: {
          50:  '#fdf2f4', 100: '#fce4e9', 200: '#f8c9d3', 300: '#f09eb1',
          400: '#e35c7d', 500: '#c81e45', 600: '#a0002a', 700: '#800022',
          800: '#660019', 900: '#4d0013', 950: '#2e000b',
        },
        secondary: {
          50:  '#fefaf0', 100: '#fdf3d6', 200: '#fae3a3', 300: '#f5cd6b',
          400: '#e9ba3f', 500: '#d4af37', 600: '#b8912a', 700: '#967420',
          800: '#755916', 900: '#5c440f', 950: '#332508',
        },
        indigo: {
          50:  '#fdf2f4', 100: '#fce4e9', 200: '#f8c9d3', 300: '#f09eb1',
          400: '#e35c7d', 500: '#c81e45', 600: '#a0002a', 700: '#800022',
          800: '#660019', 900: '#4d0013', 950: '#2e000b',
        },
        violet: {
          50:  '#fefaf0', 100: '#fdf3d6', 200: '#fae3a3', 300: '#f5cd6b',
          400: '#e9ba3f', 500: '#d4af37', 600: '#b8912a', 700: '#967420',
          800: '#755916', 900: '#5c440f', 950: '#332508',
        },
        purple: {
          50:  '#fefaf0', 100: '#fdf3d6', 200: '#fae3a3', 300: '#f5cd6b',
          400: '#e9ba3f', 500: '#d4af37', 600: '#b8912a', 700: '#967420',
          800: '#755916', 900: '#5c440f', 950: '#332508',
        },
        surface: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        display: ['"Inter"', 'system-ui', 'sans-serif'],
        body:    ['"Inter"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        brand:      '0 0 20px rgba(200, 30, 69, 0.35)',
        'brand-lg': '0 0 40px rgba(212, 175, 55, 0.4)',
        card:       '0 2px 16px rgba(15, 23, 42, 0.18)',
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