import type { Metadata } from "next";
import { Space_Grotesk, Instrument_Serif } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-headline",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zo Earn — Bounties, Projects, Grants",
  description: "Zo it. Earn it. Find bounties, projects, and grants.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${instrumentSerif.variable} bg-zui-dark text-zui-white antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
