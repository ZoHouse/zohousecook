import { Head } from "@zo/moal";
import { AppProps } from "next/app";
import { Space_Grotesk } from "next/font/google";
import { AuthProvider } from "../components/auth";
import { Main } from "../components/common";
import "./styles.css";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], display: "swap" });
const mainClass = `h-full w-full ${spaceGrotesk.className}`;

function CustomApp({ Component, pageProps }: AppProps) {
  return (
    <main className={mainClass}>
      <AuthProvider isLoginRequired>
        <Head />
        <Main Component={Component} pageProps={pageProps} />
      </AuthProvider>
    </main>
  );
}

export default CustomApp;
