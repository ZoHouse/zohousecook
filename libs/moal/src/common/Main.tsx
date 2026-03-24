/* eslint-disable @typescript-eslint/no-explicit-any */
import { GeneralObject } from "@zo/definitions/general";
import { NextComponentType, NextPageContext } from "next";
import { useRouter } from "next/router";
import React from "react";
import Head from "./Head";
import MainNavigation from "./Navigation";

interface MainProps {
  Component: NextComponentType<NextPageContext, any, GeneralObject>;
  pageProps: any;
  navigationLinks: GeneralObject;
  profile?: GeneralObject;
  logout?: () => void;
}

const Main: React.FC<MainProps> = ({
  Component,
  pageProps,
  profile,
  logout,
  navigationLinks,
}) => {
  const router = useRouter();

  return (
    <main className="scrollbar flex min-h-screen w-full transition-all ease-in-out duration-200">
      <Head />
      {!router.pathname.includes("unauthorized") ? (
        <div className="flex w-full h-full">
          <MainNavigation
            navigationLinks={navigationLinks}
            profile={profile}
            logout={logout}
          />
          <div className="flex-1 overflow-x-hidden">
            <Component {...pageProps} />
          </div>
        </div>
      ) : null}
    </main>
  );
};

export default Main;
