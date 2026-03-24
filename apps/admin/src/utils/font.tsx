import { Rubik, Space_Grotesk } from "next/font/google";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], display: "swap" });
const rubik = Rubik({
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
});

const fontClassName = spaceGrotesk.className;
const rubikClassName = rubik.className;

export { fontClassName,rubikClassName };
