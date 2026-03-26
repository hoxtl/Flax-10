/*
 * Generic modal for displaying a list of items with loading and empty states.
 */

import StandardModal from "../standard_modal/StandardModal";
import EmptyState from "../empty_state/EmptyState";
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

function ModalBody({ loading, hasItems, listContent, listClasses, emptyContent, emptyIcon, emptyMessage, emptyDescription }) {
  if (loading) return <LoadingRows />;
  if (!hasItems) return emptyContent || <EmptyState icon={emptyIcon} title={emptyMessage || 'No items found.'} description={emptyDescription} />;
  return <div className={listClasses}>{listContent}</div>;
}

/** Modal that renders a scrollable list with loading skeleton and empty state support. */

export default function GenericSummaryModal({
  isOpen, onClose, title, subtitle, emptyMessage, emptyIcon, emptyDescription,
  emptyContent, items, renderItem, topContent, children, loading = false,
  containerClassName = "", listClassName = "",
}) {
  if (!isOpen) return null;
  const hasItems = items && items.length > 0;
  const listContent = children || (renderItem && items?.map((item, index) => renderItem(item, index)));
  const containerClasses = [styles.container, containerClassName].filter(Boolean).join(" ");
  const listClasses = [styles.list, listClassName].filter(Boolean).join(" ");
  return (
    <StandardModal title={title} subtitle={subtitle} onClose={onClose}>
      <div className={containerClasses}>
        {topContent && <div className={styles.topContent}>{topContent}</div>}
        <ModalBody loading={loading} hasItems={hasItems} listContent={listContent} listClasses={listClasses}
          emptyContent={emptyContent} emptyIcon={emptyIcon} emptyMessage={emptyMessage} emptyDescription={emptyDescription} />
      </div>
    </StandardModal>
  );
}
