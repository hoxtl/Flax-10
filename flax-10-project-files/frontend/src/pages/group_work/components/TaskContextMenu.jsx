/*
 * Shared context menu portal for group task cards.
 */

import { createPortal } from "react-dom";
import { useEffect } from "react";
import { Pencil, Trash2 } from "lucide-react";
import ctxStyles from "../../tasks/components/TaskCardContextMenu.module.css";

function ContextMenuPortal({ pos, task, onDelete, onClose, onEditStart }) {
    const menuPos = { '--ctx-top': `${pos.y}px`, '--ctx-left': `${pos.x}px` };
    return (
        <div
            className={ctxStyles.ctxMenu}
            style={menuPos}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <button className={ctxStyles.ctxItem} onClick={() => { onClose(); onEditStart(); }}>
                <Pencil size={14} strokeWidth={2} /> Edit
            </button>
            <div className={ctxStyles.ctxDivider} />
            <button className={`${ctxStyles.ctxItem} ${ctxStyles.ctxItemDanger}`} onClick={() => { onClose(); onDelete(task.id); }}>
                <Trash2 size={14} strokeWidth={2} /> Delete
            </button>
        </div>
    );
}

export default function TaskContextMenu({ pos, task, onDelete, onClose, onEditStart }) {
    useEffect(() => {
        document.addEventListener("mousedown", onClose);
        return () => document.removeEventListener("mousedown", onClose);
    }, [onClose]);
    return createPortal(<ContextMenuPortal pos={pos} task={task} onDelete={onDelete} onClose={onClose} onEditStart={onEditStart} />, document.body);
}
