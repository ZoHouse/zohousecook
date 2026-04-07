import "mapbox-gl/dist/mapbox-gl.css";
import { AppProps } from "next/app";
import "./styles.css";
import "../components/helpers/house/house.css";

import Icon from "@zo/assets/icons";
import { AuthProvider, ZostelAuthProvider } from "@zo/auth";
import { fontClassName } from "@zo/utils/font";
import { useWindowSize } from "@zo/utils/hooks";
import React, { useEffect } from "react";
import { Toaster } from "sonner";
import { Head, Main } from "../components/common";

// On zozozo.work (staging), ZOSTEL_APP_ID is set → wrap in Zostel auth for unified login
// On zo.xyz (production), it's not set → skip Zostel auth (website is public)
const ZOSTEL_ENABLED = !!process.env.ZOSTEL_APP_ID;

function ConditionalZostelAuth({ children }: { children: React.ReactNode }) {
  if (!ZOSTEL_ENABLED) return <>{children}</>;
  return <ZostelAuthProvider localKey="zostel">{children}</ZostelAuthProvider>;
}

function CustomApp({ Component, pageProps }: AppProps) {
  const { isMobile } = useWindowSize();

  useEffect(() => {
    if (isMobile) {
      return;
    }

    const blob = document.createElement("div");
    blob.className = "blob";

    document.body.appendChild(blob);

    const handlePointerMove = (event: { clientX: number; clientY: number }) => {
      const { clientX, clientY } = event;

      const adjustedX = clientX + window.scrollX;
      const adjustedY = clientY + window.scrollY;

      blob.animate(
        {
          left: `${adjustedX}px`,
          top: `${adjustedY}px`,
        },
        {
          duration: 1000,
          fill: "forwards",
          easing: "ease-out",
        }
      );
    };

    window.addEventListener("pointermove", handlePointerMove);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      document.body.removeChild(blob);
    };
  }, [isMobile]);

  return (
    <main className={fontClassName}>
      <ConditionalZostelAuth>
        <AuthProvider
          localKey={ZOSTEL_ENABLED ? "zo-admin" : "zo-web"}
          isLoginRequired={ZOSTEL_ENABLED}
          isZostelLoginRequired={ZOSTEL_ENABLED}
          allowedLoginTypes={ZOSTEL_ENABLED ? ["mobile"] : undefined}
        >
          <Head />
          <Main Component={Component} pageProps={pageProps} />
        </AuthProvider>
      </ConditionalZostelAuth>
      <Toaster
        icons={{
          success: <Icon name="CheckCircle" size={24} fill="#000" />,
          error: <Icon name="Warning" size={24} fill="#000" />,
          warning: <Icon name="Info" size={24} fill="#000" />,
          info: <Icon name="Info" size={24} fill="#000" />,
          loading: <Icon name="Clock" size={24} fill="#000" />,
        }}
        richColors
        position="bottom-center"
        toastOptions={{
          classNames: {
            success: "zui-toast-success",
            error: "zui-toast-error",
            warning: "zui-toast-warning",
            info: "zui-toast-warning",
            loading: "zui-toast-warning",
          },
        }}
      />
    </main>
  );
}

export default CustomApp;
