import { AuthProvider, ZostelAuthProvider } from "@zo/auth";
import { cn, fontClassName } from "@zo/utils/font";
import { AppProps } from "next/app";
import { NextPage } from "next";
import { useRouter } from "next/router";
import React, { ReactElement, ReactNode, useEffect } from "react";
import { Footer, Head, Header } from "../components/common";
import "./styles.css";
import Icon from "@zo/assets/icons";
import { Toaster } from "sonner";

const REFERRER_KEY = "zo_referrer";

// First-touch referrer capture: anyone landing on /room/:handle gets the handle stashed
// in localStorage before auth gates mount. Redeemed during signup in libs/auth onboarding
// once the Zo API exposes a field for it. Overwrites are blocked (first-touch wins);
// self-referral is filtered later at redeem time when the viewer's own handle is known.
function useCaptureReferrer() {
  const router = useRouter();
  useEffect(() => {
    if (typeof window === "undefined") return;
    const match = router.asPath.match(/^\/room\/([^\/?#]+)/);
    if (!match) return;
    const handle = decodeURIComponent(match[1]).replace(/^@/, "");
    if (!handle) return;
    if (window.localStorage.getItem(REFERRER_KEY)) return;
    window.localStorage.setItem(REFERRER_KEY, handle);
  }, [router.asPath]);
}

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
  useCaptureReferrer();

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
