import NextHead from "next/head";
import React from "react";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface HeadProps {}

const Head: React.FC<HeadProps> = () => {
  return (
    <>
      <NextHead>
        <link rel="preconnect" href="https://use.typekit.net" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="icon" href="/favicon.ico" />
        <title>Zo World</title>
      </NextHead>
    </>
  );
};

export default Head;
