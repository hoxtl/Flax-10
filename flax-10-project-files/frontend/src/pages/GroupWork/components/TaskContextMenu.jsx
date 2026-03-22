/*
 * Shared context menu for group work task cards.
 */

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Pencil, Trash2 } from "lucide-react";
import ctxStyles from "../../Tasks/components/TaskCardContextMenu.module.css";

export function useContextMenuClose(onClose) {
    useEffect(() => {
        document.addEventListener("mousedown", onClose);
        return () => document.removeEventListener("mousedown", onClose);
    }, [onClose]);
}

/** Inline context menu with Edit and Delete actions for a task card. */
export default function TaskContextMenu({ onClose, onDelete, onEditStart, pos, task }) {
    useContextMenuClose(onClose);
    return createPortal(
        <div className={ctxStyles.ctxMenu} style={{ position: "fixed", top: pos.y, left: pos.x, zIndex: 10000 }} onMouseDown={(e) => e.stopPropagation()}>
            <button className={ctxStyles.ctxItem} onClick={() => { onClose(); onEditStart(); }}><Pencil size={14} strokeWidth={2} /> Edit</button>
            <div className={ctxStyles.ctxDivider} />
            <button className={`${ctxStyles.ctxItem} ${ctxStyles.ctxItemDanger}`} onClick={() => { onClose(); onDelete(task.id); }}><Trash2 size={14} strokeWidth={2} /> Delete</button>
        </div>,
        document.body
    );
}
