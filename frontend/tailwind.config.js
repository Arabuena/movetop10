/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        '99': {
          'primary': '#E30613',    // Vermelho principal
          'secondary': '#FF3366',  // Rosa
          'yellow': '#FFB300',     // Amarelo
          'black': '#1A1A1A',      // Preto
          'gray': {
            100: '#F5F5F5',
            200: '#EEEEEE',
            300: '#E0E0E0',
            400: '#BDBDBD',
            500: '#9E9E9E',
            600: '#757575',
            700: '#616161',
            800: '#424242',
            900: '#212121',
          },
          primary: {
            50: '#fff1f1',
            100: '#ffdfdf',
            200: '#ffc5c5',
            300: '#ff9d9d',
            400: '#ff6464',
            500: '#ff2b2b',
            600: '#ff0000',
            700: '#e60000',
            800: '#cc0000',
            900: '#b30000',
          }
        }
      }
    },
  },
  plugins: [],
} 