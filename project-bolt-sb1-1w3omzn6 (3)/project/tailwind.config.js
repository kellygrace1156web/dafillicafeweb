/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f4f7f4',
          100: '#e3ebe4',
          200: '#c7d7ca',
          300: '#a0bba6',
          400: '#7a9e82',
          500: '#5a8265',
          600: '#466a51',
          700: '#385541',
          800: '#2d4435',
          900: '#243629',
          950: '#152019',
        },
      },
    },
  },
  plugins: [],
};
