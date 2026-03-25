/* eslint-disable @typescript-eslint/no-explicit-any */
import { GeneralObject } from "@zo/definitions/general";
import { Head } from "@zo/moal";
import { Spin } from "antd";
import { NextComponentType, NextPageContext } from "next";
import { useRouter } from "next/router";
import React from "react";
import { useAssociation } from "../../../../src/hooks";
import { ZO_FEATURES, isFeatureVisible, hasPrincipalAccess } from "../../../configs";
import { AssociationProvider } from "../../contexts/association";
import AccessDenied from "./AccessDenied";
import Navigation from "./Navigation";

// Customer-facing routes bypass admin shell (no sidebar, no role check)
const CUSTOMER_ROUTES = ["/cafe/order/"];

interface MainProps {
  Component: NextComponentType<NextPageContext, any, GeneralObject>;
  pageProps: any;
}

const Main: React.FC<MainProps> = ({ Component, pageProps }) => {
  const router = useRouter();
  const isCustomerRoute = CUSTOMER_ROUTES.some((r) =>
    router.pathname.startsWith(r)
  );

  if (isCustomerRoute) {
    return (
      <main className="min-h-screen w-full">
        <Component {...pageProps} />
      </main>
    );
  }

  return (
    <main className="scrollbar flex min-h-screen w-full transition-all ease-in-out duration-200">
      <Head />

      <AssociationProvider>
        <AppShell>
          <Component {...pageProps} />
        </AppShell>
      </AssociationProvider>
    </main>
  );
};

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { effectiveRole, principals, selectedOperator } = useAssociation();
  const hasAnyAccess =
    effectiveRole !== "none" ||
    Object.values(ZO_FEATURES).some(
      (f) =>
        isFeatureVisible(f, selectedOperator?.code) &&
        hasPrincipalAccess(f, principals)
    );

  return (
    <div className="flex w-full h-full">
      <Navigation />
      <div className="flex-1 overflow-x-hidden">
        {effectiveRole == null ? (
          <div className="flex items-center justify-center w-full h-[80vh]">
            <Spin size="large" />
          </div>
        ) : !hasAnyAccess ? (
          <AccessDenied />
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default Main;
