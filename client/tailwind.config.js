/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,scss,ts}'],
  theme: {
    extend: {
      colors: {
        // Core palette - Arcane Trading Hall
        gwt: {
          // Backgrounds
          void: '#0a0a0b',
          obsidian: '#121214',
          slate: '#1a1a1e',
          stone: '#242428',

          // Golds & Ambers
          gold: '#d4a855',
          'gold-bright': '#f0c674',
          'gold-dim': '#8b7355',
          amber: '#c9873a',
          copper: '#b87333',

          // Functional
          parchment: '#e8dcc4',
          'parchment-dim': '#bfb5a3',
          rust: '#8b4513',
          blood: '#8b2500',

          // Legacy compatibility
          back: '#00000088',
          semi: '#88888888',
          light: '#D4BA77DD',
          brown: '#461C0FDD'
        }
      },
      fontFamily: {
        fritz: ['Frtzquad', 'Georgia', 'serif'],
        body: ['Segoe UI', 'system-ui', 'sans-serif']
      },
      fontSize: {
        tiny: '.65rem',
        '2xs': '.7rem'
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem'
      },
      boxShadow: {
        'glow-gold': '0 0 20px rgba(212, 168, 85, 0.15)',
        'glow-gold-strong': '0 0 30px rgba(212, 168, 85, 0.3)',
        'inner-light': 'inset 0 1px 0 rgba(255,255,255,0.05)',
        'card': '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)'
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")"
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      },
      borderRadius: {
        'sm': '3px',
        'DEFAULT': '4px',
        'md': '6px'
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)'
      }
    }
  },
  plugins: []
};
