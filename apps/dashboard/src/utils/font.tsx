import { Space_Grotesk, Syne, Rubik } from "next/font/google";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], display: "swap" });
const fontClassName = spaceGrotesk.className;

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-syne",
  display: "swap",
});

const rubik = Rubik({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-rubik",
  display: "swap",
});

const syneClassName = syne.className;
const rubikClassName = rubik.className;
const syneVariable = syne.variable;
const rubikVariable = rubik.variable;

export { fontClassName, syneClassName, rubikClassName, syneVariable, rubikVariable };
