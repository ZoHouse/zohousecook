import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { track } from "../lib/analytics/track";

const MILESTONES = [25, 50, 75, 100] as const;

export function useScrollMilestones(): void {
  const router = useRouter();
  const fired = useRef<Set<number>>(new Set());

  useEffect(() => {
    fired.current.clear();
    const onScroll = () => {
      const scrolled =
        (window.scrollY + window.innerHeight) /
        document.documentElement.scrollHeight;
      const percent = Math.floor(scrolled * 100);
      for (const m of MILESTONES) {
        if (percent >= m && !fired.current.has(m)) {
          fired.current.add(m);
          track("scroll_milestone", { percent: m, page_path: router.pathname });
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [router.pathname]);
}
