import { AppProps } from "next/app";
import Head from "next/head";
import { ConfigProvider, theme as antdTheme } from "antd";
import { Toaster } from "sonner";
import { Layout } from "../components/Layout";
import "./styles.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Social Engine · Zo</title>
      </Head>
      <ConfigProvider
        theme={{
          algorithm: antdTheme.darkAlgorithm,
          token: {
            colorPrimary: "#cfff50",
            fontFamily: "Space Grotesk, sans-serif",
            borderRadius: 8,
          },
        }}
      >
        <Toaster richColors position="bottom-center" theme="dark" />
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ConfigProvider>
    </>
  );
}
