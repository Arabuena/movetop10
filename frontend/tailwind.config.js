// tailwind.config.js
const customColors = require('./src/theme/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'move-primary': customColors.primary,
        'move-gray': customColors.gray,
      },
      spacing: {
        '72': '18rem',
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
