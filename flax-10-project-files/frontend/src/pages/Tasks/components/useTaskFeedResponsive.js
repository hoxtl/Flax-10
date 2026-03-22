/*
 * Responsive helpers for the task feed layout.
 */

import { useEffect, useState } from "react";

function isMobileViewport() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(max-width: 900px)")?.matches ?? false;
}

export default function useTaskFeedResponsive() {
  const [isMobile, setIsMobile] = useState(isMobileViewport);
  const [showMobileLists, setShowMobileLists] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(isMobileViewport());
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return { isMobile, showMobileLists, setShowMobileLists };
}
