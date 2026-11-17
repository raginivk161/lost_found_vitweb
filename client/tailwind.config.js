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
          DEFAULT: '#0F1B4C',
          light: '#1B2A6B',
          dark: '#081030',
        },
        primary: {
          DEFAULT: '#2F5BEA',
          hover: '#2448BF',
          light: '#EEF2FD',
        },
        lost: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
          dark: '#B45309',
        },
        found: {
          DEFAULT: '#10B981',
          light: '#D1FAE5',
          dark: '#047857',
        },
        surface: '#FFFFFF',
        background: '#F7F8FC',
        textMain: '#1E293B',
        muted: '#64748B',
        danger: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '14px',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(15, 27, 76, 0.06), 0 2px 6px -1px rgba(15, 27, 76, 0.04)',
        'hover': '0 10px 25px -3px rgba(47, 91, 234, 0.12), 0 4px 10px -2px rgba(15, 27, 76, 0.04)',
      },
    },
  },
  plugins: [],
}
