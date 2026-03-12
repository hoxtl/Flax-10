import StandardModal from "../StandardModal/StandardModal";
import styles from "./GenericSummaryModal.module.css";

export default function GenericSummaryModal({ isOpen, onClose, title, subtitle, emptyMessage, items, renderItem, topContent, children }) {
    if (!isOpen) return null;

    const hasItems = items && items.length > 0;
    const listContent = children || (renderItem && items?.map((item, index) => renderItem(item, index)));

    return (
        <StandardModal title={title} subtitle={subtitle} onClose={onClose}>
            <div className={styles.container}>
                {topContent && <div className={styles.topContent}>{topContent}</div>}
                {!hasItems ? (
                    <div className={styles.empty}>{emptyMessage || 'No items found.'}</div>
                ) : (
                    <div className={styles.list}>{listContent}</div>
                )}
            </div>
        </StandardModal>
    );
}
