/*
 * Context menu for mini timeline event actions.
 */

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Pencil, Trash2 } from "lucide-react";

function useMenuDismiss(menuRef, onClose) {
  useEffect(() => {
    const handleMouseDown = (event) => !menuRef.current?.contains(event.target) && onClose?.();
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [menuRef, onClose]);
}

function ContextButton({ styles, className = "", icon, label, onClick }) {
  return <button className={`${styles.contextItem} ${className}`.trim()} onClick={onClick}>{icon} {label}</button>;
}

export function EventContextMenu({ eventItem, pos, onEdit, onDelete, onClose, styles }) {
  const menuRef = useRef(null);
  useMenuDismiss(menuRef, onClose);
  const handleEdit = () => (onEdit?.(eventItem), onClose?.());
  const handleDelete = async () => (await onDelete?.(eventItem), onClose?.());
  const menuPos = { '--ctx-top': pos.y, '--ctx-left': pos.x };
  return createPortal(<div ref={menuRef} className={styles.contextMenu} style={menuPos} onMouseDown={(event) => event.stopPropagation()} onContextMenu={(event) => event.preventDefault()}><ContextButton styles={styles} icon={<Pencil size={14} strokeWidth={2} className={styles.contextIcon} />} label="Edit" onClick={handleEdit} /><div className={styles.contextDivider} /><ContextButton styles={styles} className={styles.contextDelete} icon={<Trash2 size={14} strokeWidth={2} className={styles.contextIcon} />} label="Delete" onClick={handleDelete} /></div>, document.body);
}
