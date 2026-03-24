import React, { useEffect } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const useOutsideClick = (node: React.RefObject<any>, callback: () => void) => {
  const handler = (e: Event) => {
    if (node.current && !node.current.contains(e.target)) {
      callback();
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);

    return () => {
      document.removeEventListener("mousedown", handler);
      document.addEventListener("touchstart", handler);
    };
  });
};

export default useOutsideClick;
