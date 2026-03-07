import StandardModal from "../StandardModal/StandardModal";
import styles from "./GenericSummaryModal.module.css";

export default function GenericSummaryModal({ isOpen, onClose, title, subtitle, emptyMessage, items, renderItem, topContent }) {
    if (!isOpen) return null;

    return (
        <StandardModal title={title} subtitle={subtitle} onClose={onClose}>
            <div className={styles.container}>
                {topContent && <div className={styles.topContent}>{topContent}</div>}
                {(!items || items.length === 0) ? (
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
