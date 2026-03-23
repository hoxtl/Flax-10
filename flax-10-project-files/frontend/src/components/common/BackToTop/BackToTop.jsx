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
  const container = document.querySelector(containerSelector);
  if (!container) return undefined;
  const onScroll = () => setVisible(container.scrollTop > 100);
  requestAnimationFrame(onScroll);
  container.addEventListener("scroll", onScroll);
  return () => container.removeEventListener("scroll", onScroll);
}

function scrollContainerToTop(containerSelector) {
  document.querySelector(containerSelector)?.scrollTo({ top: 0, behavior: "smooth" });
}
