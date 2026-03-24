import { Rubik, Space_Grotesk, Syne } from "next/font/google";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], display: "swap" });
const rubik = Rubik({
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
});
const syne = Syne({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-syne", // Enable CSS variable
  adjustFontFallback: false // Disable auto font size adjustment
});

const fontClassName = spaceGrotesk.className;
const rubikClassName = rubik.className;
const syneClassName = syne.className;

export { fontClassName, rubikClassName, syneClassName };
