/* eslint-disable @typescript-eslint/no-explicit-any */
import { GeneralObject } from "@zo/definitions/general";
import { cn, fontClassName } from "@zo/utils/font";
import { NextComponentType, NextPageContext } from "next";
import { useRouter } from "next/router";
import React, { useMemo } from "react";
import Footer from "./Footer";
import Header from "./Header";

interface MainProps {
  Component: NextComponentType<NextPageContext, any, GeneralObject>;
  pageProps: any;
}

const excludeFooterIn = [
  "/music",
  "/events/token2049",
  "/san-francisco",
  "/events/cryptoevents",
  "/cafezomad",
  "/zollardoe",
];
const excludeHeaderIn = [
  "/events/token2049",
  "/san-francisco",
  "/events/cryptoevents",
  "/cafezomad",
  "/zollardoe",
];

const hasBlackBackground = ["/membership"];

const Main: React.FC<MainProps> = ({ Component, pageProps }) => {
  const router = useRouter();

  const shouldShowFooter = useMemo(() => {
    return !excludeFooterIn.some((path) => router.pathname.startsWith(path));
  }, [router.pathname]);

  const shouldShowHeader = useMemo(() => {
    return !excludeHeaderIn.some((path) => router.pathname.startsWith(path));
  }, [router.pathname]);

  return (
    <main
      className={cn(
        "h-full flex flex-col w-full transition-all ease-in-out duration-200",
        fontClassName,
        hasBlackBackground.some((path) => router.pathname.startsWith(path)) &&
          "bg-black"
      )}
    >
      {shouldShowHeader && <Header />}
      <Component {...pageProps} />
      {shouldShowFooter && <Footer />}
    </main>
  );
};

export default Main;
