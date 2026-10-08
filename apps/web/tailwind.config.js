const basePreset = require('../../packages/config/tailwind/preset');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [basePreset],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
