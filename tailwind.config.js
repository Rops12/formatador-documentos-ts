const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Define 'sans' como a família da fonte principal, com 'Inter' na frente.
        sans: ['Inter', ...fontFamily.sans],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}