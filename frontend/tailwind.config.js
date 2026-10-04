/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: '#FDFBF9',
          100: '#F7F3EE',   // Primary Dashboard Background
          200: '#EDE4D8',   // Soft Borders & Separators
          300: '#D8C5B2',   // Muted Text
          400: '#C69A7B',   // Warm Tan / Latte Accent
          500: '#A76D49',   // Terracotta / Caramel (Primary Brand Accent)
          600: '#8A5432',   // Deep Terracotta Hover
          700: '#5E3823',   // Dark Mocha
          800: '#3B261E',   // Cocoa Card Accents / Sidebar Hover
          900: '#241813',   // Deep Espresso (Sidebar Background)
          950: '#170E0B',   // Deepest Midnight Roast
        },
        sage: {
          50: '#F2F8F4',
          100: '#E2F0E6',
          500: '#3D8C55',   // Positive growth badges
          700: '#2A633B',
        },
        cream: {
          surface: '#FFFFFF',
          soft: '#FBF8F5',
          border: 'rgba(59, 38, 30, 0.08)',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'warm-sm': '0 2px 8px rgba(36, 24, 19, 0.04)',
        'warm-md': '0 8px 24px rgba(36, 24, 19, 0.06)',
        'warm-lg': '0 16px 40px rgba(36, 24, 19, 0.08)',
        'warm-glow': '0 0 20px rgba(167, 109, 73, 0.25)',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
    },
  },
  plugins: [],
};
