/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 🌲 Existing Tailwind greens
        green: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },

        // 🌿 Custom mapped colors for your button + card styles
        forest: {
          50: '#f0fdf4',   // light green for hover/bg
          100: '#dcfce7',
          200: '#bbf7d0',
          500: '#22c55e',   // matches Tailwind green-500
          600: '#16a34a',   // matches Tailwind green-600
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        wood: {
          50: '#fdf7f3',
          100: '#f4e2d3',
          200: '#e2bfa5',
          300: '#d19776',
          400: '#bf6f47',
          500: '#a85632',
          600: '#8f4426',
          700: '#75351e',
          800: '#5c2817',
          900: '#421b10',
        },
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },

      animation: {
        pan: 'pan 30s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        bounce: 'bounce 2s infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pan: {
          '0%': { transform: 'scale(1.1) translateX(0) translateY(0)' },
          '25%': { transform: 'scale(1.1) translateX(-1%) translateY(-1%)' },
          '50%': { transform: 'scale(1.1) translateX(-2%) translateY(-2%)' },
          '75%': { transform: 'scale(1.1) translateX(-1%) translateY(-1%)' },
          '100%': { transform: 'scale(1.1) translateX(0) translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
