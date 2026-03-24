const { createGlobPatternsForDependencies } = require("@nrwl/next/tailwind");
const { join } = require("path");

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("../../tailwind-workspace.config.js")],
  content: [
    join(__dirname, "src/**/*.{js,ts,jsx,tsx,json}"),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
