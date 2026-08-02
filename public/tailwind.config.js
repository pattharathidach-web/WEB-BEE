/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./*.html'],
  safelist: [
    { pattern: /^(bg|text|border)-(emerald|green|red|yellow|blue|gray|slate)-(50|100|200|600|700|800)$/ }
  ],
  theme: {
    extend: {
      fontFamily: {
        sarabun: ['Sarabun', 'sans-serif']
      }
    }
  },
  plugins: []
};
