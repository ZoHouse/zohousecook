import { MutableRefObject, useEffect, useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const useInViewport = (ref: MutableRefObject<any>) => {
  const [isIntersecting, setIntersecting] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let observer: any;
    if (window) {
      observer = new IntersectionObserver(([entry]) =>
        setIntersecting(entry.isIntersecting)
      );
      observer.observe(ref.current);
    }
    // Remove the observer as soon as the component is unmounted
    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return isIntersecting;
};

export default useInViewport;
