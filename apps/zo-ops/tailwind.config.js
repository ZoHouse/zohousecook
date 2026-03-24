const { createGlobPatternsForDependencies } = require("@nx/react/tailwind");
const { join } = require("path");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(__dirname, "src/**/*.{js,ts,jsx,tsx,json}"),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
