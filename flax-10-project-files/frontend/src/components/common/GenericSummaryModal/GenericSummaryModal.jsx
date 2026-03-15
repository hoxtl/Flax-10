import StandardModal from "../StandardModal/StandardModal";
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

export default function GenericSummaryModal({ isOpen, onClose, title, subtitle, emptyMessage, items, renderItem, topContent, loading = false }) {
    if (!isOpen) return null;

    return (
        <StandardModal title={title} subtitle={subtitle} onClose={onClose}>
            <div className={styles.container}>
                {topContent && <div className={styles.topContent}>{topContent}</div>}
                {loading ? (
                    <LoadingRows />
                ) : (!items || items.length === 0) ? (
                    <div className={styles.empty}>{emptyMessage || 'No items found.'}</div>
                ) : (
                    <div className={styles.list}>
                        {items.map((item, index) => renderItem(item, index))}
                    </div>
                )}
            </div>
        </StandardModal>
    );
}
