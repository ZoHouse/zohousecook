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
      colors: {
        "zo-orange": "#f15824",
        "zo-dark": "rgb(24, 24, 24)",
        "zo-dark-gray": "rgb(30, 30, 30)",
        light: "#FAFEFF",
        accent: "#E8F0F2",
        "zui-black": "#171717",
        "zui-white": "#F9FAFB",
        "zui-red": "#FF0D0F",
        "zui-yellow": "#FFFE01",
        "zui-magenta": "#EA1FFF",
        "zui-violet": "#0123FF",
        "zui-green": "#1DD701",
        "zui-orange": "#FF8503",
        "dash-bg": "rgba(0, 0, 0, 0.4)",
        "dash-bg-solid": "#000000",
        "dash-bg-secondary": "rgba(0, 0, 0, 0.08)",
        "dash-border": "rgba(255, 255, 255, 0.08)",
        "dash-border-hover": "rgba(255, 255, 255, 0.16)",
        "dash-text": "#FFFFFF",
        "dash-text-80": "rgba(255, 255, 255, 0.8)",
        "dash-text-50": "rgba(255, 255, 255, 0.5)",
        "dash-text-40": "rgba(255, 255, 255, 0.4)",
        "dash-accent": "#CFFF50",
      },
      borderRadius: {
        "dash-sm": "8px",
        "dash-md": "12px",
        "dash-lg": "24px",
        "dash-pill": "100px",
      },
      backdropBlur: {
        "dash-light": "20px",
        "dash-md": "32px",
        "dash-heavy": "40px",
      },
      spacing: {
        "dash-xs": "4px",
        "dash-sm": "8px",
        "dash-md": "12px",
        "dash-lg": "16px",
        "dash-xl": "24px",
        "dash-2xl": "40px",
      },
      fontFamily: {
        rubik: ['"Rubik"', "sans-serif"],
        display: ['"Jost"', '"Futura"', "sans-serif"],
      },
      boxShadow: {
        "dash-card": "0px 4px 4px 0px rgba(18, 18, 18, 0.25)",
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
