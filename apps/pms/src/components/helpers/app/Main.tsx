/* eslint-disable @typescript-eslint/no-explicit-any */
import { GeneralObject } from "@zo/definitions/general";
import { Head } from "@zo/moal";
import { Collapse, Spin } from "antd";
import { NextComponentType, NextPageContext } from "next";
import { useRouter } from "next/router";
import React from "react";
import { useAssociation } from "../../../../src/hooks";
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

/**
 * On-screen auth diagnostic. Renders ONLY for a logged-in user who got into
 * the app but whose operator/house never resolved (selectedOperator has no
 * `code`) — i.e. exactly the broken state where Zo House features stay
 * hidden. Invisible to everyone whose operator resolved normally.
 *
 * Lets an affected staff member surface the resolution state (do they have
 * permissions? did CRS return operators?) by tapping one expander and
 * screenshotting it — no browser dev-tools needed. See PR #137.
 */
const AuthDiagnostics: React.FC = () => {
  const {
    effectiveRole,
    selectedOperator,
    principals,
    associatedOperators,
    diagnostics,
  } = useAssociation();

  // Not logged in / still resolving / denied → handled elsewhere.
  if (effectiveRole == null || effectiveRole === "none") return null;
  // Operator/house resolved fine — nothing to diagnose.
  if (selectedOperator?.code) return null;

  const report = {
    effectiveRole,
    principals,
    selectedOperator: {
      id: selectedOperator?.id ?? null,
      code: selectedOperator?.code ?? null,
      name: selectedOperator?.name ?? null,
    },
    associatedOperatorsCount: associatedOperators?.length ?? 0,
    permissionsCount: diagnostics.permissionsCount,
    operatorAssociationsCount: diagnostics.operatorAssociationsCount,
    rawOperatorsCount: diagnostics.rawOperatorsCount,
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 12,
        right: 12,
        zIndex: 1000,
        maxWidth: 380,
      }}
    >
      <Collapse
        ghost
        items={[
          {
            key: "auth-diag",
            label: (
              <span className="text-xs text-zui-silver">
                ⚠ Account not linked to a house — tap for details
              </span>
            ),
            children: (
              <pre
                className="text-xs bg-zui-bg/60 p-3 rounded border border-zui-light overflow-x-auto"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {JSON.stringify(report, null, 2)}
              </pre>
            ),
          },
        ]}
      />
    </div>
  );
};

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { effectiveRole } = useAssociation();
  const hasAnyAccess = effectiveRole !== "none";

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
          <>
            {children}
            <AuthDiagnostics />
          </>
        )}
      </div>
    </div>
  );
};

export default Main;
