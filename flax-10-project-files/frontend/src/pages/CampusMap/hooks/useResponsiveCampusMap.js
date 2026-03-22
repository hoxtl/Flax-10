/**
 * Responsive campus map UI effects.
 */
import { useEffect } from "react";

const MIN_MAP_SKELETON_MS = 900;

export function useResponsiveCampusMap(setUi, isMobile) {
  useEffect(() => {
    const handleResize = () => setUi((current) => ({ ...current, isMobile: window.innerWidth < 900 }));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setUi]);
  useEffect(() => { const timer = window.setTimeout(() => setUi((current) => ({ ...current, minSkeletonElapsed: true })), MIN_MAP_SKELETON_MS); return () => window.clearTimeout(timer); }, [setUi]);
  useEffect(() => { if (!isMobile) return setUi((current) => ({ ...current, mobileInitialOpen: true })); const frame = requestAnimationFrame(() => setUi((current) => ({ ...current, mobileInitialOpen: false }))); return () => cancelAnimationFrame(frame); }, [isMobile, setUi]);
}
