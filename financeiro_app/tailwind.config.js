/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.js', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: { ink: '#0B1220', panel: '#111B2E', muted: '#8D9AB3', line: '#25324A', mint: '#65D6A5', coral: '#FF7C82', sky: '#72B9FF' },
    },
  },
  plugins: [],
};
