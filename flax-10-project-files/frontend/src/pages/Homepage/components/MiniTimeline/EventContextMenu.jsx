import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Pencil, Trash2 } from "lucide-react";

export function EventContextMenu({ eventItem, pos, onEdit, onDelete, onClose, styles }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose?.();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const menu = (
    <div
      ref={menuRef}
      className={styles.contextMenu}
      style={{ top: pos.y, left: pos.x }}
      onMouseDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <button
        className={styles.contextItem}
        onClick={() => {
          onEdit?.(eventItem);
          onClose?.();
        }}
      >
        <Pencil size={14} strokeWidth={2} className={styles.contextIcon} /> Edit
      </button>
      <div className={styles.contextDivider} />
      <button
        className={`${styles.contextItem} ${styles.contextDelete}`}
        onClick={async () => {
          await onDelete?.(eventItem);
          onClose?.();
        }}
      >
        <Trash2 size={14} strokeWidth={2} className={styles.contextIcon} /> Delete
      </button>
    </div>
  );

  return createPortal(menu, document.body);
}

