// apps/website/src/components/homecoming/ScrollRail.tsx

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import Lenis from "@studio-freight/lenis";
import { RAIL_TOTAL_VH } from "../../lib/homecoming/beatTimeline";

interface ScrollCtx {
  progress: number;
  scrollY: number;
  scrollHeight: number;
}

const ScrollContext = createContext<ScrollCtx>({ progress: 0, scrollY: 0, scrollHeight: 1 });
export const useScrollProgress = () => useContext(ScrollContext);

interface Props {
  children: React.ReactNode;
  disabled?: boolean;
}

export function ScrollRail({ children, disabled = false }: Props) {
  const [ctx, setCtx] = useState<ScrollCtx>({ progress: 0, scrollY: 0, scrollHeight: 1 });
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (disabled) {
      const onScroll = () => {
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight || 1;
        setCtx({ progress: h.scrollTop / max, scrollY: h.scrollTop, scrollHeight: max });
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      return () => window.removeEventListener("scroll", onScroll);
    }

    const lenis = new Lenis({
      duration: 1.4,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.2,
    });
    lenisRef.current = lenis;

    let raf = 0;
    const tick = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    lenis.on("scroll", ({ scroll, limit }: { scroll: number; limit: number }) => {
      const max = limit || 1;
      setCtx({ progress: scroll / max, scrollY: scroll, scrollHeight: max });
    });

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [disabled]);

  return (
    <ScrollContext.Provider value={ctx}>
      <div style={{ height: `${RAIL_TOTAL_VH}vh`, position: "relative" }}>
        {children}
      </div>
    </ScrollContext.Provider>
  );
}
