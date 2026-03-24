import { AppProps } from "next/app";
import "./styles.css";

import { AuthProvider, ZostelAuthProvider } from "@zo/auth";
import React, { useEffect } from "react";
import { Toaster } from "sonner";
import { comicNeueClassName } from "../components/utils";

const ZOSTEL_ENABLED = !!process.env.ZOSTEL_APP_ID;

function ConditionalZostelAuth({ children }: { children: React.ReactNode }) {
  if (!ZOSTEL_ENABLED) return <>{children}</>;
  return <ZostelAuthProvider localKey="zostel">{children}</ZostelAuthProvider>;
}

const mainClass = `h-full w-full ${comicNeueClassName}`;

function CustomApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    const floodContainer = document.createElement("div");
    floodContainer.id = "flood-container";
    document.body.appendChild(floodContainer);

    const createFloodImages = (x: number, y: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const img = document.createElement("img");
        img.src =
          "https://cdn.zo.xyz/gallery/media/images/b3d39269-3ff5-43b8-8972-b069d3b3aca2_20240724150529.gif";
        img.className = "flood-image";
        img.style.left = `${x - 10}px`;
        img.style.top = `${y - 10}px`;
        img.style.height = `${32}px`;
        img.style.width = `${32}px`;

        img.style.setProperty(
          "--translate-x",
          `${Math.random() * 100 - 100}px`
        );
        img.style.setProperty(
          "--translate-y",
          `${Math.random() * 100 + 100}px`
        );
        floodContainer.appendChild(img);

        setTimeout(() => {
          img.remove();
        }, 1000);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleMouseMove = (event: any) => {
      const x = event.clientX + 15;
      const y = event.clientY - 15;
      createFloodImages(x, y, 1);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleClick = (event: any) => {
      const x = event.clientX;
      const y = event.clientY;
      createFloodImages(x, y, 6);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("click", handleClick);
      floodContainer.remove();
    };
  }, []);

  return (
    <main className={mainClass}>
      <ConditionalZostelAuth>
        <AuthProvider
          localKey={ZOSTEL_ENABLED ? "zo-admin" : "zo-web"}
          isLoginRequired={ZOSTEL_ENABLED}
          isZostelLoginRequired={ZOSTEL_ENABLED}
          allowedLoginTypes={ZOSTEL_ENABLED ? ["mobile"] : undefined}
        >
          <Component {...pageProps} />
          <Toaster
            richColors
            position="bottom-center"
            className="toast-container"
            toastOptions={{
              classNames: {
                success: "zui-toast-success",
                error: "zui-toast-error",
                warning: "zui-toast-warning",
                info: "zui-toast-warning",
                loading: "zui-toast-warning",
              },
            }}
            offset={20}
          />
        </AuthProvider>
      </ConditionalZostelAuth>
    </main>
  );
}

export default CustomApp;
