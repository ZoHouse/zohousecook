import { useEffect, useRef, useState } from "react";

const useInitialTimeout = (delay: number) => {
  const [isReady, setReady] = useState<boolean>(false);

  useEffect(() => {
    const id = setTimeout(() => {
      setReady(true);
    }, delay);
    return () => clearTimeout(id);
  }, [delay]);

  return isReady;
};

export default useInitialTimeout;
