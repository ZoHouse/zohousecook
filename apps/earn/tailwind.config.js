const { createGlobPatternsForDependencies } = require("@nrwl/next/tailwind");
const { join } = require("path");

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("../../tailwind-workspace.config.js")],
  darkMode: "class",
  content: [
    join(__dirname, "src/**/*.{js,ts,jsx,tsx}"),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground, #fff)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['var(--font-sans)', '"Space Grotesk"', "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        headline: ['var(--font-headline)', '"Instrument Serif"', "serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
