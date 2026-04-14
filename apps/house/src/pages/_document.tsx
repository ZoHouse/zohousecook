import { Html, Head, Main, NextScript } from "next/document";

const FAVICON_URL =
  "https://cdn.zo.xyz/gallery/media/images/96402471-9ce9-40f4-9530-e6f36a0beb65_20260414182119.svg";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href={FAVICON_URL} type="image/svg+xml" />
        <link rel="shortcut icon" href={FAVICON_URL} type="image/svg+xml" />
        <link rel="apple-touch-icon" href={FAVICON_URL} />
        <meta name="theme-color" content="#d4af37" />
      </Head>
      <body style={{ background: "#000" }}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
