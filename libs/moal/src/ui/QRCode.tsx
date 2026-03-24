import { isClient } from "@zo/utils/next";
import React, { useEffect, useRef } from "react";

interface QRCodeProps {
  link: string;
  image?: string;
  className?: string;
  backgroundColor?: string;
  rounded?: boolean;
  children?: React.ReactNode;
}

const QRCode: React.FC<QRCodeProps> = ({
  link,
  backgroundColor = "#e9ebee",
  rounded = true,
  image,
  className,
  children,
}) => {
  const qrCodeCanvasRef = useRef<HTMLDivElement>(null);

  console.log(link);

  useEffect(() => {
    const qrContainer = qrCodeCanvasRef.current;
    if (link && isClient) {
      const QrCode = require("qr-code-styling");
      const qrCode = new QrCode({
        width: 300,
        height: 300,
        type: "canvas",
        data: link,

        dotsOptions: {
          type: rounded ? "rounded" : "square",
        },
        backgroundOptions: {
          color: backgroundColor,
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
