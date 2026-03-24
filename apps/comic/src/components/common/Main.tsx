/* eslint-disable @typescript-eslint/no-explicit-any */
import { GeneralObject } from "@zo/definitions/general";
import { cn, fontClassName } from "@zo/utils/font";
import { NextComponentType, NextPageContext } from "next";
import React from "react";

interface MainProps {
  Component: NextComponentType<NextPageContext, any, GeneralObject>;
  pageProps: any;
}

const Main: React.FC<MainProps> = ({ Component, pageProps }) => {
  return (
    <main
      className={cn(
        "h-full flex flex-col w-full transition-all ease-in-out duration-200",
        fontClassName
      )}
    >
      <Component {...pageProps} />
    </main>
  );
};

export default Main;
