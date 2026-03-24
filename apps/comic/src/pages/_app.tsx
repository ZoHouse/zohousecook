import { AppProps } from "next/app";
import { Head, Main } from "../components/common";
import "./styles.css";

function CustomApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Welcome to comic!</title>
      </Head>
      <Main Component={Component} pageProps={pageProps} />
    </>
  );
}

export default CustomApp;
