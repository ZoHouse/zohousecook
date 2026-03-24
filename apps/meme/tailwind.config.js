const { createGlobPatternsForDependencies } = require("@nrwl/next/tailwind");
const { join } = require("path");

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("../../tailwind-workspace.config.js")],
  content: [
    join(__dirname, "src/**/*.{js,ts,jsx,tsx}"),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      fontFamily: {
        "comic-sans": ['"Comic Sans MS"', "cursive", "sans-serif"],
      },
      animation: {
        "spin-slow": "spin 20s linear infinite",
        "spin-slow-reverse": "spin 20s linear reverse infinite",
        wiggle: "wiggle 1s ease-in-out infinite",
      },
      keyframes: {
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
      },
      rotate: {
        15: "15deg",
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
