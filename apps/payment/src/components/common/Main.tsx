/* eslint-disable @typescript-eslint/no-explicit-any */
import { GeneralObject } from "@zo/definitions/general";
import { cn, fontClassName } from "@zo/utils/font";
import { NextComponentType, NextPageContext } from "next";
import { useRouter } from "next/router";
import React from "react";
import Footer from "./Footer";
import Head from "./Head";
import Header from "./Header";

interface MainProps {
  Component: NextComponentType<NextPageContext, any, GeneralObject>;
  pageProps: any;
}
const Main: React.FC<MainProps> = ({ Component, pageProps }) => {
  const router = useRouter();
  return (
    <main
      className={cn(
        "h-full flex flex-col w-full transition-all ease-in-out duration-200",
        fontClassName
      )}
    >
      <Head />
      <Header />
      <Component {...pageProps} />
      {<Footer />}
    </main>
  );
};

export default Main;
