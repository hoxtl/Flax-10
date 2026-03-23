/*
 * Pagination controls and scroll-to-top affordance.
 */

import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import styles from "./Pagination.module.css";

const BUTTON_WIDTHS = { next: 75, previous: 99 };

export function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  const pages = getPageNumbers(currentPage, totalPages);
  return (
    <div className={styles.pagination}>
      <NavButton direction="previous" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} />
      <PageNumbers currentPage={currentPage} onPageChange={onPageChange} pages={pages} />
      <NavButton direction="next" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} />
    </div>
  );
}

function NavButton({ direction, disabled, onClick }) {
  const ref = useRef(null);
  const hideText = useHiddenButtonText(ref, direction);
  const isNext = direction === "next";
  return (
    <button ref={ref} className={styles.pageButton} disabled={disabled} onClick={onClick}>
      {!isNext && <span className={styles.arrow}>←</span>}
      {!hideText && <span className={styles.pageButtonText}>{isNext ? "Next" : "Previous"}</span>}
      {isNext && <span className={styles.arrow}>→</span>}
    </button>
  );
}

function useHiddenButtonText(ref, direction) {
  const [hideText, setHideText] = useState(false);
  useEffect(() => observeButtonWidth(ref, direction, setHideText), [direction, ref]);
  return hideText;
}

function observeButtonWidth(ref, direction, setHideText) {
  const node = ref.current;
  if (!node) return undefined;
  const update = () => setHideText(node.getBoundingClientRect().width < BUTTON_WIDTHS[direction]);
  update();
  const observer = new ResizeObserver(update);
  observer.observe(node);
  return () => observer.disconnect();
}

function PageNumbers({ currentPage, onPageChange, pages }) {
  return (
    <div className={styles.pageNumbers}>
      {pages.map((page, index) => <PageItem key={index} currentPage={currentPage} onPageChange={onPageChange} page={page} />)}
    </div>
  );
}

function PageItem({ page, currentPage, onPageChange }) {
  if (page === "...") return <span className={styles.ellipsis}>...</span>;
  const className = page === currentPage ? `${styles.pageNum} ${styles.active}` : styles.pageNum;
  return <button className={className} onClick={() => onPageChange(page)}>{page}</button>;
}

function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  if (current <= 3) return [1, 2, 3, 4, "...", total];
  if (current >= total - 2) return [1, "...", total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
}

export function BackToTop({ alwaysVisible = false, containerSelector = '[class*="content"]' }) {
  const visible = useBackToTopVisibility(alwaysVisible, containerSelector);
  if (!(alwaysVisible || visible)) return null;
  return (
    <button className={styles.backToTop} onClick={() => scrollContainerToTop(containerSelector)}>
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
