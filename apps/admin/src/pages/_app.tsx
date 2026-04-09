import { AuthProvider, ZostelAuthProvider } from "@zo/auth";
import { Head } from "@zo/moal";
import { App, ConfigProvider } from "antd";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet/dist/leaflet.css";
import { AppProps } from "next/app";
import { Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import { Main } from "../components/helpers/app";
import theme from "../config/themeConfig";
import "./styles.css";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], display: "swap" });
const mainClass = `h-full w-full ${spaceGrotesk.className}`;

function CustomApp({ Component, pageProps }: AppProps) {
  return (
    <main className={mainClass}>
      <ConfigProvider theme={theme}>
        <App>
          <Toaster position="top-right" richColors />
          <ZostelAuthProvider localKey="zostel">
            <AuthProvider
              localKey="zo-admin"
              isLoginRequired
              isZostelLoginRequired
              allowedLoginTypes={["mobile"]}
              showOtherLoginOptions={true}
              skipOnboarding
            >
              <Head />

              <Main Component={Component} pageProps={pageProps} />
            </AuthProvider>
          </ZostelAuthProvider>
        </App>
      </ConfigProvider>
    </main>
  );
}

export default CustomApp;
