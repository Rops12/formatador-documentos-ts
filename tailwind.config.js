/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Já está preparado para TS!
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'), // Plugin para o `prose`
  ],
}