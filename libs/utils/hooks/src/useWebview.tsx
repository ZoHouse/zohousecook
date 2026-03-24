/* eslint-disable @typescript-eslint/no-explicit-any */
import { GeneralObject } from "@zo/definitions/general";
import { useEffect, useState } from "react";

const useWebview = () => {
  const [inWebview, setWebview] = useState<boolean>(false);
  const [message, setMessage] = useState<GeneralObject | null>(null);

  const handleMessage = (e: any) => {
    if (e.data) {
      setMessage(e.data);
    }
  };

  useEffect(() => {
    const _wind: any = window;
    if (_wind.ReactNativeWebView) {
      setWebview(true);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("message", handleMessage);

    return () => {
      document.removeEventListener("message", handleMessage);
    };
  });

  const sendWebViewMessage = (message: GeneralObject) => {
    const _wind: any = window;
    if (_wind.ReactNativeWebView) {
      _wind.ReactNativeWebView.postMessage(JSON.stringify(message));
    }
  };

  return { inWebview, sendWebViewMessage, message };
};

export default useWebview;
