/*
 * Shared floating back-to-top control for scrollable page containers.
 */

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import styles from "./BackToTop.module.css";

export default function BackToTop({ alwaysVisible = false, containerSelector = '[class*="content"]' }) {
  const visible = useBackToTopVisibility(alwaysVisible, containerSelector);
  if (!(alwaysVisible || visible)) return null;
  return (
    <button
      type="button"
      className={styles.backToTop}
      onClick={() => scrollContainerToTop(containerSelector)}
      aria-label="Back to top"
    >
      <ArrowUp color="white" size={20} strokeWidth={2.5} />
    </button>
  );
}

function useBackToTopVisibility(alwaysVisible, containerSelector) {
  const [visible, setVisible] = useState(false);
  useEffect(() => watchScrollVisibility(alwaysVisible, containerSelector, setVisible), [alwaysVisible, containerSelector]);
  return visible;
}

function watchScrollVisibility(alwaysVisible, containerSelector, setVisible) {
  if (alwaysVisible) return undefined;
  const containers = resolveScrollContainers(containerSelector);
  if (containers.length === 0) return undefined;
  const scrollTargets = [...new Set(containers.map((container) => (isDocumentScroller(container) ? window : container)))];
  const onScroll = () => setVisible(containers.some((container) => getScrollTop(container) > 100));
  requestAnimationFrame(onScroll);
  scrollTargets.forEach((target) => target.addEventListener("scroll", onScroll, { passive: true }));
  return () => scrollTargets.forEach((target) => target.removeEventListener("scroll", onScroll));
}

function scrollContainerToTop(containerSelector) {
  const containers = resolveScrollContainers(containerSelector);
  if (containers.length === 0) return;
  containers.forEach(scrollTargetToTop);
}

function scrollTargetToTop(container) {
  if (isDocumentScroller(container)) {
    window.scrollTo?.({ top: 0, behavior: "smooth" });
    return;
  }
  if (typeof container.scrollTo === "function") {
    container.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  container.scrollTop = 0;
}

function resolveScrollContainers(containerSelector) {
  const selectors = [
    containerSelector,
    "[data-dashboard-main]",
    "[data-dashboard-main-content]",
    '[class*="content"]',
  ].filter(Boolean);
  const containers = selectors
    .map((selector) => document.querySelector(selector))
    .filter(Boolean);
  if (document.scrollingElement) containers.push(document.scrollingElement);
  return [...new Set(containers)];
}

function isDocumentScroller(container) {
  return container === document.body || container === document.documentElement || container === document.scrollingElement;
}

function getScrollTop(container) {
  if (isDocumentScroller(container)) return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
  return container.scrollTop;
}
