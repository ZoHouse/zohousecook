import { GoogleTagManager } from "@next/third-parties/google";
import { isValidString } from "@zo/utils/string";
import NextHead from "next/head";
import React from "react";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface HeadProps {
  title?: string;
  gtmId?: string;
}

const Head: React.FC<HeadProps> = ({ title = "Admin | Zo World", gtmId }) => {
  return (
    <NextHead>
      {isValidString(gtmId) && process.env.NODE_ENV === "production" && (
        <GoogleTagManager gtmId={gtmId || ""} />
      )}
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
      <title>{title}</title>
    </NextHead>
  );
};

export default Head;
