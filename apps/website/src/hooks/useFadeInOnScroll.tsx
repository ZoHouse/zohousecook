import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { RefObject, useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

export const useFadeInOnScroll = <T extends HTMLElement>(options?: {
  duration?: number;
  start?: string;
  end?: string;
  ease?: string;
}): RefObject<T> => {
  const sectionRef = useRef<T>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    gsap.fromTo(
      sectionRef.current,
      { opacity: 0, translateY: "50px" },
      {
        opacity: 1,
        translateY: 0,
        duration: options?.duration || 2.5,
        ease: options?.ease || "power2.out",
        scrollTrigger: {
          once: true,
          trigger: sectionRef.current,
          start: options?.start || "top 80%",
          end: options?.end || "top 40%",
          scrub: true,
        },
      }
    );
  }, [options]);

  return sectionRef;
};
