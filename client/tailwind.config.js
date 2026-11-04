/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'airtel-red': '#E40000',
        'dark-red': '#B91C1C',
        primary: '#111827',
        secondary: '#4B5563',
        divider: '#E5E7EB',
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Noto Sans Devanagari',
          'sans-serif',
        ],
      },
      maxWidth: {
        mobile: '480px',
        admin: '1280px',
      },
      spacing: {
        4.5: '1.125rem',
      },
      fontSize: {
        h1: ['1.5rem', { lineHeight: '2rem', fontWeight: '700' }],
        h2: ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        h3: ['1.125rem', { lineHeight: '1.5rem', fontWeight: '600' }],
      },
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
    },
  },
  plugins: [],
};
