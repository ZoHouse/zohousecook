import NextHead from "next/head";
import React from "react";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface HeadProps {}

const Head: React.FC<HeadProps> = () => {
  return (
    <>
      <NextHead>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://use.typekit.net" />
        <link rel="prefetch" href="https://static.cdn.zo.xyz" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="shortcut icon"
          href="https://static.cdn.zo.xyz/media/zo-v2-dynamic.svg"
          type="image/svg+xml"
        />
      </NextHead>
    </>
  );
};

export default Head;
