import { isClient } from "@zo/utils/next";
import React, { useEffect, useRef } from "react";

interface QRCodeProps {
  link: string;
  image?: string;
  className?: string;
  children?: React.ReactNode;
}

const QRCode: React.FC<QRCodeProps> = ({
  link,
  image,
  className,
  children,
}) => {
  const qrCodeCanvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const qrContainer = qrCodeCanvasRef.current;
    if (link && isClient) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const QrCode = require("qr-code-styling");
      const qrCode = new QrCode({
        width: 300,
        height: 300,
        type: "canvas",
        data: link,
        // image:
        //   image ||
        //   "https://upload.wikimedia.org/wikipedia/commons/4/4f/Twitter-logo.svg",
        dotsOptions: {
          type: "rounded",
        },
        backgroundOptions: {
          color: "#e9ebee",
        },
        imageOptions: {
          crossOrigin: "anonymous",
          margin: 20,
        },
      });
      if (qrContainer?.querySelector("canvas")) {
        qrContainer?.querySelector("canvas")?.remove();
      }
      qrCode.append(qrContainer);
      const qrCodeCanvas = qrContainer?.querySelector("canvas");
      if (qrCodeCanvas) {
        qrCodeCanvas.style.maxWidth = "100%";
        qrCodeCanvas.style.maxHeight = "100%";
      }
    }

    return () => {
      if (qrContainer?.querySelector("canvas")) {
        qrContainer?.querySelector("canvas")?.remove();
      }
    };
  }, [image, link]);

  return (
    <div ref={qrCodeCanvasRef} id={link} className={className}>
      {children}
    </div>
  );
};

export default QRCode;
