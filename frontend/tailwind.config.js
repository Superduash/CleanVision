/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        cv: {
          bg:        '#0d1117',
          surface:   '#161b22',
          surface2:  '#1c2330',
          border:    'rgba(255,255,255,0.08)',
          text:      '#e6edf3',
          muted:     '#8b949e',
          primary:   '#10b981',
          'primary-d':'#059669',
        },
      },
      borderRadius: {
        card: '14px',
      },
      animation: {
        'fade-in':   'fade-in 0.3s ease both',
        'spin-slow': 'spin-slow 1.4s linear infinite',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
};