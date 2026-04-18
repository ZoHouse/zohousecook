import { Rubik, Syne } from "next/font/google";

const rubik = Rubik({
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
});

const syne = Syne({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-syne",
  adjustFontFallback: false,
});

export const rubikClassName = rubik.className;
export const syneClassName = syne.className;
