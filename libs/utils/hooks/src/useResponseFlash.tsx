import { useEffect, useState } from "react";

const useResponseFlash: (
  timeout?: number
) => [string, React.Dispatch<string>] = (timeout = 3000) => {
  const [response, setResponse] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    if (response) {
      setTimeout(() => {
        if (mounted) {
          setResponse("");
        }
      }, timeout);
    }

    return () => {
      mounted = false;
    };
  }, [response, timeout]);

  return [response, setResponse];
};

export default useResponseFlash;
