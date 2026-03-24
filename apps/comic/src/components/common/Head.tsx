import NextHead from "next/head";
import React from "react";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface HeadProps {}

const Head: React.FC<HeadProps> = () => {
  return (
    <>
      <NextHead>
        <link rel="preconnect" href="https://use.typekit.net" />
        <link rel="prefetch" href="https://static.cdn.zo.xyz" />
        <link
          rel="shortcut icon"
          href="https://static.cdn.zo.xyz/media/zo-v2-dynamic.svg"
          type="image/svg+xml"
        />
        <link
          rel="icon"
          href="https://static.cdn.zo.xyz/media/zo-v2-dynamic.svg"
        />
        <title>Zo World</title>
      </NextHead>
    </>
  );
};

export default Head;
