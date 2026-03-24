import { AppProps } from "next/app";
import "./style.css";

import { AuthProvider, ZostelAuthProvider } from "@zo/auth";
import { Head } from "@zo/moal";
import { Rubik } from "next/font/google";
import { Toaster } from "sonner";
import GlobalHeader from "../components/common/GlobalHeader";

const rubik = Rubik({ subsets: ["latin"], display: "swap" });
const mainClass = `h-full w-full ${rubik.className}`;

function CustomApp({ Component, pageProps }: AppProps) {
  return (
    <main className={mainClass}>
      <ZostelAuthProvider localKey="zostel">
        <AuthProvider localKey="zo-web">
          <Head title="Complete Web-Checkin" gtmId="GTM-PWPM6Z8" />
          <Toaster richColors position="bottom-center" />
          <div className="flex flex-col items-center md:justify-center w-full h-full bg-white ease-in-out duration-200 transition-all  shadow-sm">
            <div className="w-full md:max-w-[360px] lg:max-h-[880px] h-full bg-white flex flex-col overflow-x-hidden py-6">
              <GlobalHeader />
              <Component {...pageProps} />
            </div>
          </div>
        </AuthProvider>
      </ZostelAuthProvider>
    </main>
  );
}

export default CustomApp;
