/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary:    '#2563EB',
        secondary:  '#0F172A',
        success:    '#22C55E',
        warning:    '#F59E0B',
        danger:     '#EF4444',
        surface:    '#F1F5F9',
        /* Flat dark-mode tokens — usable as bg-dark-bg, border-dark-border, etc. */
        'dark-bg':     '#0F172A',
        'dark-card':   '#1E293B',
        'dark-border': '#334155',
        'dark-muted':  '#475569',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        card:      '0 1px 4px 0 rgb(0 0 0 / .06), 0 2px 8px -2px rgb(0 0 0 / .06)',
        'card-md': '0 4px 16px -2px rgb(0 0 0 / .1), 0 2px 6px -2px rgb(0 0 0 / .06)',
        'card-lg': '0 8px 32px -4px rgb(0 0 0 / .14), 0 4px 12px -4px rgb(0 0 0 / .08)',
      },
    },
  },
  plugins: [],
}
