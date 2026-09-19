/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f5f8f4',
          100: '#e8efe6',
          200: '#d1e0cd',
          300: '#b8d0b2',
          400: '#a7c19c',
          500: '#9CAF88',
          600: '#8A9E76',
          700: '#6F8060',
          800: '#56614B',
          900: '#3D4636',
          950: '#262D22',
        },
      },
    },
  },
  plugins: [],
};
