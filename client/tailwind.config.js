/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#F4F8F5',
          100: '#E5EDE7',
          200: '#C8DACF',
          300: '#AEC5B8', // Key requested accent color
          400: '#8DAA99',
          500: '#5F8570',
          600: '#3F6350',
          700: '#2D483A',
          800: '#1C3026',
          900: '#14221B',
        },
        forest: {
          50: '#F0F5F2',
          100: '#DCE7E1',
          500: '#1E3F30',
          600: '#173427',
          700: '#11271D',
          800: '#0D1D16',
          900: '#08120E',
        },
        navy: {
          50: '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          300: '#9FB3C8',
          400: '#829AB1',
          500: '#627D98',
          600: '#486581',
          700: '#334E68',
          800: '#243B53',
          900: '#102A43',
          950: '#081A2B',
        },
        emerald: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#2D483A',
          700: '#1C3026',
          800: '#14221B',
          900: '#0D1D16',
        },
        mint: {
          50: '#F4F8F5',
          100: '#E5EDE7',
          200: '#C8DACF',
          300: '#AEC5B8',
        },
        blue: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        brand: {
          50: '#F4F8F5',
          100: '#E5EDE7',
          200: '#C8DACF',
          300: '#AEC5B8',
          500: '#2D483A',
          600: '#1C3026',
          700: '#14221B',
          800: '#1C3026',
          900: '#14221B',
        },
        slate: {
          850: '#081A2B',
          950: '#040F1B',
        }
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'xs': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['Manrope', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
