/*
 * List sidebar UI parts.
 */
import { useEffect, useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import styles from "./ListSidebar.module.css";

function handleRenameKeyDown(event, draftValue, value, onSave, onCancel) {
  if (event.key === "Enter") onSave(draftValue.trim() || value);
  if (event.key === "Escape") onCancel();
}

export function RenameInput({ value, onSave, onCancel }) {
  const [draftValue, setDraftValue] = useState(value);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);
  return <input ref={inputRef} className={styles.renameInput} value={draftValue} onChange={(event) => setDraftValue(event.target.value)} onKeyDown={(event) => handleRenameKeyDown(event, draftValue, value, onSave, onCancel)} onBlur={() => onSave(draftValue.trim() || value)} />;
}

function useCtxMenuOutsideClick(ref, onClose) {
  useEffect(() => {
    const handler = (event) => { if (!ref.current.contains(event.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onClose]);
}

function useCtxMenuPosition(ref, x, y) {
  useEffect(() => {
    ref.current.style.setProperty("--ctx-top", `${y}px`);
    ref.current.style.setProperty("--ctx-left", `${x}px`);
  }, [ref, x, y]);
}

export function ListContextMenu({ x, y, onRename, onDelete, onClose }) {
  const ref = useRef(null);
  useCtxMenuOutsideClick(ref, onClose);
  useCtxMenuPosition(ref, x, y);
  return (
    <div ref={ref} className={styles.ctxMenu}>
      <button className={styles.ctxItem} onClick={() => { onRename(); onClose(); }}><Pencil size={14} strokeWidth={2} /> Rename</button>
      <div className={styles.ctxDivider} />
      <button className={`${styles.ctxItem} ${styles.ctxDelete}`} onClick={() => { onDelete(); onClose(); }}><Trash2 size={14} strokeWidth={2} /> Delete list</button>
    </div>
  );
}
