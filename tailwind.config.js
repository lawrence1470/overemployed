/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Luxurious color palette inspired by romance and elegance
        primary: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899', // Main pink
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
          950: '#4c0519',
        },
        secondary: {
          50: '#f8fafc',
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
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316', // Orange accent
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        luxury: {
          gold: '#ffd700',
          'gold-light': '#fff9c4',
          'gold-dark': '#b8860b',
          champagne: '#f7e7ce',
          pearl: '#f8f6f0',
          'rose-gold': '#e8b4b8',
          platinum: '#e5e4e2',
          diamond: '#b9f2ff',
        },
        gradient: {
          'pink-orange': 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)',
          'purple-pink': 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
          'gold-champagne': 'linear-gradient(135deg, #ffd700 0%, #f7e7ce 100%)',
          'sunset': 'linear-gradient(135deg, #ff6b6b 0%, #ffa726 50%, #ffcc02 100%)',
        }
      },
      fontFamily: {
        'display': ['var(--font-display)', 'Georgia', 'serif'], // Elegant serif for headings
        'body': ['var(--font-body)', 'system-ui', 'sans-serif'], // Modern sans-serif for body text
        'script': ['var(--font-script)', 'cursive'], // Cursive for decorative elements
        'serif': ['var(--font-serif)', 'Georgia', 'serif'], // Alternative serif for quotes/testimonials
        'sans': ['var(--font-body)', 'system-ui', 'sans-serif'], // Default sans-serif
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'luxury': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'luxury-lg': '0 35px 60px -12px rgba(0, 0, 0, 0.3)',
        'inner-luxury': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'glow': '0 0 20px rgba(236, 72, 153, 0.4)',
        'glow-lg': '0 0 40px rgba(236, 72, 153, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(236, 72, 153, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(236, 72, 153, 0.4)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'luxury-gradient': 'linear-gradient(135deg, #ec4899 0%, #f97316 50%, #ffd700 100%)',
        'sunset-gradient': 'linear-gradient(135deg, #ff6b6b 0%, #ffa726 50%, #ffcc02 100%)',
        'romantic-gradient': 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #f97316 100%)',
        'pearl-gradient': 'linear-gradient(135deg, #f8f6f0 0%, #e5e4e2 100%)',
      },
      backdropBlur: {
        'luxury': '20px',
      },
    },
  },
  plugins: [],
}