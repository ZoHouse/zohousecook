import { useEffect } from "react";
import { useRouter } from "next/router";

// /apply is now an overlay on the home page. This route just redirects.
export default function ApplyRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/?apply=1");
  }, [router]);
  return null;
}
