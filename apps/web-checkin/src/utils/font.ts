import { Kalam } from "next/font/google";

const _kalam = Kalam({ 
  subsets: ["latin"], 
  display: "swap",
  weight: ["400", "700"]
});

const kalamClassName = _kalam.className;

export { kalamClassName };
