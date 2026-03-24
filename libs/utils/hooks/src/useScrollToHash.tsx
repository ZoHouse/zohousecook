import { useRouter } from "next/router";
import { useEffect } from "react";

const useScrollToHash = () => {
  const router = useRouter();

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash) {
        const elementId = hash.substring(1);
        const element = document.getElementById(elementId);

        if (element) {
          const elementTop =
            element.getBoundingClientRect().top + window.pageYOffset;
          const offset = window.innerHeight / 4;
          const scrollToPosition = elementTop - offset;

          window.scrollTo({
            top: scrollToPosition,
            behavior: "smooth",
          });
        }
      }
    };

    handleHashChange();
    router.events.on("hashChangeComplete", handleHashChange);

    return () => {
      router.events.off("hashChangeComplete", handleHashChange);
    };
  }, [router.events]);
};

export default useScrollToHash;
