import StandardModal from "../StandardModal/StandardModal";
import EmptyState from "../EmptyState/EmptyState";
import styles from "./GenericSummaryModal.module.css";

function LoadingRows() {
    return (
        <div className={styles.list} aria-hidden="true">
            {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className={styles.loadingItem}>
                    <div className={styles.loadingAvatar} />
                    <div className={styles.loadingInfo}>
                        <div className={styles.loadingLine} />
                        <div className={`${styles.loadingLine} ${styles.loadingLineShort}`} />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function GenericSummaryModal({ isOpen, onClose, title, subtitle, emptyMessage, emptyIcon, emptyDescription, items, renderItem, topContent, children, loading = false }) {
    if (!isOpen) return null;

    const hasItems = items && items.length > 0;
    const listContent = children || (renderItem && items?.map((item, index) => renderItem(item, index)));

    return (
        <StandardModal title={title} subtitle={subtitle} onClose={onClose}>
            <div className={styles.container}>
                {topContent && <div className={styles.topContent}>{topContent}</div>}
                {loading ? (
                    <LoadingRows />
                ) : !hasItems ? (
                    <EmptyState icon={emptyIcon} title={emptyMessage || 'No items found.'} description={emptyDescription} />
                ) : (
                    <div className={styles.list}>{listContent}</div>
                )}
            </div>
        </StandardModal>
    );
}
