/**
 * Context menu — clean dropdown with blur for event/task actions.
 */

import { useEffect, useRef } from "react";
import styles from "../Homepage.module.css";

const IconPencil = () => (
  <svg className={styles.contextIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
);

const IconTrash = () => (
  <svg className={styles.contextIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
);

export function ContextMenu({ x, y, item, onEdit, onDelete, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div ref={ref} className={styles.contextMenu} style={{ top: y, left: x }} role="menu">
      <button type="button" role="menuitem" className={styles.contextItem} onClick={() => { onEdit(item); onClose(); }}>
        <IconPencil /> Edit
      </button>
      <div className={styles.contextDivider} />
      <button type="button" role="menuitem" className={`${styles.contextItem} ${styles.contextDelete}`} onClick={() => { onDelete(item.id); onClose(); }}>
        <IconTrash /> Delete
      </button>
    </div>
  );
}
