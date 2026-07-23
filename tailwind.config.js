/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pitch: '#37003c',
        accent: '#00ff87',
      },
    },
  },
  plugins: [],
};
