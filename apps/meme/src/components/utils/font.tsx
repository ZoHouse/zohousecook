import { Space_Grotesk, Comic_Neue } from "next/font/google";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], display: "swap" });
const comicNeue = Comic_Neue({ subsets: ["latin"], weight: ["400", "700"] });

const spaceGroteskClassName = spaceGrotesk.className;
const comicNeueClassName = comicNeue.className;

export { comicNeueClassName, spaceGroteskClassName };
