import { useState, useEffect, useRef } from "react";
import styles from "./Pagination.module.css";
import { ArrowUp } from "lucide-react";

export function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <div className={styles.pagination}>
      <NavButton
        direction="previous"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      />
      <PageNumbers
        pages={pages}
        currentPage={currentPage}
        onPageChange={onPageChange}
      />
      <NavButton
        direction="next"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      />
    </div>
  );
}

function NavButton({ direction, disabled, onClick }) {
  const ref = useRef(null);
  const [hideText, setHideText] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const update = () => {
      const width = node.getBoundingClientRect().width;
      if (direction === "next") {
        setHideText(width < 75);
        return;
      }
      setHideText(width < 99);
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(node);

    return () => observer.disconnect();
  }, [direction]);

  const isNext = direction === "next";

  return (
    <button
      ref={ref}
      className={styles.pageButton}
      onClick={onClick}
      disabled={disabled}
    >
      {!isNext && <span className={styles.arrow}>←</span>}
      {!hideText && (
        <span className={styles.pageButtonText}>
          {isNext ? "Next" : "Previous"}
        </span>
      )}
      {isNext && <span className={styles.arrow}>→</span>}
    </button>
  );
}

function PageNumbers({ pages, currentPage, onPageChange }) {
  return (
    <div className={styles.pageNumbers}>
      {pages.map((page, i) => (
        <PageItem
          key={i}
          page={page}
          currentPage={currentPage}
          onPageChange={onPageChange}
        />
      ))}
    </div>
  );
}

function PageItem({ page, currentPage, onPageChange }) {
  if (page === "...") return <span className={styles.ellipsis}>...</span>;
  const isActive = page === currentPage;
  const className = isActive
    ? `${styles.pageNum} ${styles.active}`
    : styles.pageNum;
  return (
    <button className={className} onClick={() => onPageChange(page)}>
      {page}
    </button>
  );
}

function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, "...", total];
  if (current >= total - 2)
    return [1, "...", total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
}

export function BackToTop({
  alwaysVisible = false,
  containerSelector = '[class*="content"]',
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (alwaysVisible) return;
    const container = document.querySelector(containerSelector);
    if (!container) return;
    const onScroll = () => setVisible(container.scrollTop > 100);
    requestAnimationFrame(onScroll);
    container.addEventListener("scroll", onScroll);
    return () => container.removeEventListener("scroll", onScroll);
  }, [alwaysVisible, containerSelector]);
  if (!(alwaysVisible || visible)) return null;
  return (
    <button
      className={styles.backToTop}
      onClick={() =>
        document
          .querySelector(containerSelector)
          ?.scrollTo({ top: 0, behavior: "smooth" })
      }
    >
      <ArrowUp size={20} color="white" strokeWidth={2.5} />
    </button>
  );
}
