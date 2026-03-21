/*
 * Resets scroll position to the top on route changes.
 */

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function isScrollableContainer(el) {
  const style = window.getComputedStyle(el);
  const hasScrollOverflow = style.overflow === "auto" || style.overflowY === "auto"
    || style.overflow === "scroll" || style.overflowY === "scroll";
  return hasScrollOverflow && el.scrollHeight > el.clientHeight
    && el !== document.body && el !== document.documentElement;
}

function findScrollableParent(skipEl) {
  return Array.from(document.querySelectorAll("*")).find(el => el !== skipEl && isScrollableContainer(el)) || null;
}

function findMainContainer(containerSelector) {
  if (containerSelector) return document.querySelector(containerSelector);
  return (
    document.querySelector("[data-dashboard-main]") ||
    document.querySelector("[data-dashboard-main-content]") ||
    document.querySelector(".mainContent") ||
    document.querySelector(".main") ||
    document.querySelector("main")
  );
}

function resetPageScroll(containerSelector) {
  window.scrollTo(0, 0);
  const main = findMainContainer(containerSelector);
  if (main) main.scrollTop = 0;
  const scrollable = findScrollableParent(main);
  if (scrollable) scrollable.scrollTop = 0;
}

/** Resets scroll position to the top on route changes, skipping calendar routes. */
export default function ScrollToTop({ containerSelector }) {
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname.startsWith("/calendar")) return;
    resetPageScroll(containerSelector);
  }, [pathname, containerSelector]);
  return null;
}
