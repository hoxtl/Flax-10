import styles from "./Pagination.module.css";

export default function Pagination({ currentPage, totalPages, onPageChange }) {
    if (totalPages <= 1) return null;
    const pages = getPageNumbers(currentPage, totalPages);

    return (
        <nav className={styles.pagination}>
            <PrevButton currentPage={currentPage} onPageChange={onPageChange} />
            <PageNumbers pages={pages} currentPage={currentPage} onPageChange={onPageChange} />
            <NextButton currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
        </nav>
    );
}

function PrevButton({ currentPage, onPageChange }) {
    const disabled = currentPage === 1;
    return (
        <button className={styles.navBtn} onClick={() => onPageChange(currentPage - 1)} disabled={disabled}>
            Prev
        </button>
    );
}

function NextButton({ currentPage, totalPages, onPageChange }) {
    const disabled = currentPage === totalPages;
    return (
        <button className={styles.navBtn} onClick={() => onPageChange(currentPage + 1)} disabled={disabled}>
            Next
        </button>
    );
}

function PageNumbers({ pages, currentPage, onPageChange }) {
    return (
        <div className={styles.pages}>
            {pages.map((page, i) => (
                <PageButton key={i} page={page} currentPage={currentPage} onPageChange={onPageChange} />
            ))}
        </div>
    );
}

function PageButton({ page, currentPage, onPageChange }) {
    if (page === "...") return <span className={styles.ellipsis}>...</span>;
    const isActive = page === currentPage;
    const className = isActive ? `${styles.pageBtn} ${styles.active}` : styles.pageBtn;
    return <button className={className} onClick={() => onPageChange(page)}>{page}</button>;
}

function getPageNumbers(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 3) return [1, 2, 3, 4, "...", total];
    if (current >= total - 2) return [1, "...", total - 3, total - 2, total - 1, total];
    return [1, "...", current - 1, current, current + 1, "...", total];
}
