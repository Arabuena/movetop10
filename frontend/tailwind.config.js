const { colors } = require('./src/theme/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'move-primary': colors.primary,
        'move-gray': colors.gray,
      },
    },
  },
  plugins: [],
} 