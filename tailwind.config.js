/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Tare brand: warm amber/wood tones ─────────────────────────────
        // Used as `bg-brand-500`, `text-brand-600`, etc. throughout the app.
        // Replaces the previous cyan brand without renaming any utility class.
        brand: {
          50:  '#fdf8f1',
          100: '#fbeed8',
          200: '#f6dcb1',
          300: '#efc380',
          400: '#e6a44d',
          500: '#d68a2c',   // primary amber/honey
          600: '#b86c1e',
          700: '#92521b',
          800: '#75421d',
          900: '#5e361b',
          950: '#371d0c',
        },
        // ── Wood-toned neutrals ────────────────────────────────────────────
        // Use as `bg-wood-50`, `text-wood-700`, etc.
        wood: {
          50:  '#fbf6ec',   // warm cream page background
          100: '#f4ebd6',
          200: '#e8d9b6',
          300: '#d8bf8b',
          400: '#c39e63',
          500: '#a98049',
          600: '#8b643a',
          700: '#6e4f30',
          800: '#523a25',
          900: '#352719',
          950: '#1c150e',
        },
        // ── Per-category soft accents (warm-shifted) ──────────────────────
        // Soft tints for tile backgrounds; deep variants for label text.
        meds:  { soft: '#fce4d8', mid: '#f59669', deep: '#9a3412' },   // terracotta
        glu:   { soft: '#dceef7', mid: '#5fa8d3', deep: '#0c4a6e' },   // muted ocean
        weight:{ soft: '#ede5f4', mid: '#9b7cc7', deep: '#4c1d95' },   // dusty plum
        active:{ soft: '#dde9d3', mid: '#7ea764', deep: '#365314' },   // moss
        // ── Glucose status (existing) ──────────────────────────────────────
        glucose: {
          low:    '#ef4444',
          normal: '#22c55e',
          high:   '#f97316',
          vhigh:  '#dc2626',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Inter Tight"', 'Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        display: '-0.025em',
      },
      borderRadius: {
        tile: '1.375rem',  // 22px — matches Image 391 tile radius
      },
      boxShadow: {
        tile: '0 1px 2px rgba(82, 58, 37, 0.04), 0 4px 14px rgba(82, 58, 37, 0.06)',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        ripple: {
          '0%':   { transform: 'scale(0.4)', opacity: '0.6' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s linear infinite',
        ripple:  'ripple 1.4s ease-out forwards',
      },
    },
  },
  plugins: [],
}
