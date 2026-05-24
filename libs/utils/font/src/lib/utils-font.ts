import { Poppins } from "next/font/google";

// Poppins is the website body font (replaces Space Grotesk). next/font/google
// requires explicit weights since Poppins isn't a variable font — these cover
// the weights actually used across the app (regular through extra-bold).
const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
});
const fontClassName = poppins.className;

export { fontClassName };
