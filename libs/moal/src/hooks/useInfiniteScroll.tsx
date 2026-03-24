import { useEffect, useState } from "react";

export const useInfiniteScroll = (ref?: React.MutableRefObject<any>) => {
  const [endReached, setEndReached] = useState(false);

  const onScroll = (event: any) => {
    const { scrollHeight, scrollTop, clientHeight } = ref
      ? event.target
      : event.target.scrollingElement;

    if (scrollHeight - scrollTop <= clientHeight * 1.5) {
      setEndReached(true);
    } else {
      setEndReached(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    const element = ref?.current;
    if (element) {
      element.addEventListener("scroll", onScroll);
    } else {
      window.addEventListener("scroll", onScroll);
    }
    return () => {
      if (element) {
        element?.removeEventListener("scroll", onScroll);
      } else {
        window.removeEventListener("scroll", onScroll);
      }
    };
  }, [ref]);

  return { endReached, resetEnd: () => setEndReached(false) };
};
