import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" />
        <meta name="theme-color" content="#d4af37" />
      </Head>
      <body style={{ background: "#000" }}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
