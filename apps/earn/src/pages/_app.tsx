import { AuthProvider, ZostelAuthProvider } from "@zo/auth";
import { AppProps } from "next/app";
import { Space_Grotesk, Instrument_Serif } from "next/font/google";
import Head from "next/head";
import "./styles.css";

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

function CustomApp({ Component, pageProps }: AppProps) {
  return (
    <main
      className={`${spaceGrotesk.variable} ${instrumentSerif.variable} dark min-h-screen bg-zui-dark font-sans text-zui-white antialiased`}
    >
      <Head>
        <title>Zo Earn — Bounties, Projects, Grants</title>
        <meta
          name="description"
          content="Zo it. Earn it. Find bounties, projects, and grants."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <ZostelAuthProvider localKey="zostel">
        <AuthProvider
          localKey="zo-earn"
          allowedLoginTypes={["mobile"]}
          skipOnboarding
        >
          <Component {...pageProps} />
        </AuthProvider>
      </ZostelAuthProvider>
    </main>
  );
}

export default CustomApp;
