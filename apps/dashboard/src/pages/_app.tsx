import { AuthProvider, ZostelAuthProvider } from "@zo/auth";
import { cn, fontClassName } from "@zo/utils/font";
import { AppProps } from "next/app";
import { NextPage } from "next";
import React, { ReactElement, ReactNode } from "react";
import { Footer, Head, Header } from "../components/common";
import "./styles.css";
import Icon from "@zo/assets/icons";
import { Toaster } from "sonner";

const ZOSTEL_ENABLED = !!process.env.ZOSTEL_APP_ID;

function ConditionalZostelAuth({ children }: { children: React.ReactNode }) {
  if (!ZOSTEL_ENABLED) return <>{children}</>;
  return <ZostelAuthProvider localKey="zostel">{children}</ZostelAuthProvider>;
}

export type NextPageWithLayout<P = object, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

const toasterIcons = {
  success: <Icon name="CheckCircle" size={24} fill="#000" />,
  error: <Icon name="Warning" size={24} fill="#000" />,
  warning: <Icon name="Info" size={24} fill="#000" />,
  info: <Icon name="Info" size={24} fill="#000" />,
  loading: <Icon name="Clock" size={24} fill="#000" />,
};

const toasterClassNames = {
  success: "zui-toast-success",
  error: "zui-toast-error",
  warning: "zui-toast-warning",
  info: "zui-toast-warning",
  loading: "zui-toast-warning",
};

function CustomApp({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout;

  return (
    <>
      <ConditionalZostelAuth>
        <AuthProvider
          localKey={ZOSTEL_ENABLED ? "zo-admin" : "zo-web"}
          isLoginRequired
          isZostelLoginRequired={ZOSTEL_ENABLED}
          allowedLoginTypes={ZOSTEL_ENABLED ? ["mobile"] : undefined}
        >
        <Head />
        {getLayout ? (
          <main
            className={cn(
              "flex flex-col w-full h-full min-h-screen overflow-hidden",
              fontClassName
            )}
          >
            {getLayout(<Component {...pageProps} />)}
          </main>
        ) : (
          <>
            <main
              className={cn(
                "flex flex-col w-full h-full min-h-screen overflow-hidden bg-black text-zui-white",
                fontClassName
              )}
            >
              <Header />
              <section className="flex-grow relative">
                <Component {...pageProps} />
              </section>
            </main>
            <Footer />
          </>
        )}
        <Toaster
          icons={toasterIcons}
          richColors
          position="bottom-center"
          toastOptions={{ classNames: toasterClassNames }}
        />
        </AuthProvider>
      </ConditionalZostelAuth>
    </>
  );
}

export default CustomApp;
