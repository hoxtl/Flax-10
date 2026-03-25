/*
 * Reusable portal modal with a header, close button, and configurable size.
 */

import { X } from "lucide-react";
import { createPortal } from "react-dom";
import styles from "./StandardModal.module.css";

/** Header row with a title, optional subtitle, and a close button. */

export function ModalHeader({ title, subtitle, onClose, centerText, subtitleClassName = "" }) {
  const headerClasses = centerText ? `${styles.header} ${styles.headerCentered}` : styles.header;
  const subtitleClasses = [styles.sub, subtitleClassName].filter(Boolean).join(" ");
  return (
    <div className={headerClasses}>
      <div>
        <h2 className={styles.title}>{title}</h2>
        {subtitle && <p className={subtitleClasses}>{subtitle}</p>}
      </div>
      <button className={styles.close} onClick={onClose} type="button" aria-label="Close">
        <X size={16} strokeWidth={2.2} />
      </button>
    </div>
  );
}

function buildModalClasses(size, modalClassName) {
  const sizeClass = styles[`size${size.charAt(0).toUpperCase()}${size.slice(1)}`] || "";
  return [styles.modal, sizeClass, modalClassName].filter(Boolean).join(" ");
}

function buildContentClasses(centerText, contentClassName) {
  return [styles.content, centerText && styles.contentCentered, contentClassName].filter(Boolean).join(" ");
}

/** Portal modal with configurable header, size, and content area. */

export default function StandardModal({
  title, subtitle, subtitleClassName = "", onClose, children,
  size = "md", backdropClassName = "", modalClassName = "", contentClassName = "",
  hideHeader = false, backdropRef = null, centerText = false, dismissOnBackdrop = true,
}) {
  const backdropClasses = backdropClassName ? `${styles.backdrop} ${backdropClassName}` : styles.backdrop;
  return createPortal(
    <div className={backdropClasses} onMouseDown={(event) => dismissOnBackdrop && onClose?.(event)} ref={backdropRef}>
      <div className={buildModalClasses(size, modalClassName)} onMouseDown={e => e.stopPropagation()}>
        {!hideHeader && title && (
          <ModalHeader title={title} subtitle={subtitle} subtitleClassName={subtitleClassName}
            onClose={onClose} centerText={centerText} />
        )}
        <div className={buildContentClasses(centerText, contentClassName)}>{children}</div>
      </div>
    </div>,
    document.body
  );
}
