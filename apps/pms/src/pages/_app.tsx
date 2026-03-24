import { AppProps } from "next/app";
import "./styles.css";

import { AuthProvider, ZostelAuthProvider } from "@zo/auth";
import { Head } from "@zo/moal";
import { ConfigProvider } from "antd";
import { Toaster } from "sonner";
import { Main } from "../components/helpers/app";
import theme from "../configs/themeConfig";
import "./styles.css";

function CustomApp({ Component, pageProps }: AppProps) {
  return (
    <main className="h-full w-full">
      <ConfigProvider theme={theme}>
        <ZostelAuthProvider localKey="zostel">
          <AuthProvider
            localKey="zo-web"
            isLoginRequired
            isZostelLoginRequired
            allowedLoginTypes={["mobile"]}
          >
            <Head title="Property Management | Zo World" />
            <Toaster richColors position="bottom-center" />
            <Main Component={Component} pageProps={pageProps} />
          </AuthProvider>
        </ZostelAuthProvider>
      </ConfigProvider>
    </main>
  );
}

export default CustomApp;
