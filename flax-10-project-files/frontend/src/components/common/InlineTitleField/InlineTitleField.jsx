/*
 * Inline editable title field with a click-to-edit, blur-to-save workflow.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import styles from "./InlineTitleField.module.css";

/** Returns state and handlers for managing inline edit mode. */

export function useInlineEdit(initialValue, onSave) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(initialValue);

  const start = useCallback(() => { setDraft(initialValue); setIsEditing(true); }, [initialValue]);

  const save = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== initialValue) onSave?.(trimmed);
    setIsEditing(false);
  }, [draft, initialValue, onSave]);

  const cancel = useCallback(() => { setDraft(initialValue); setIsEditing(false); }, [initialValue]);

  return { isEditing, draft, setDraft, start, save, cancel };
}

function useAutoResize(ref, isEditing, draft) {
  useEffect(() => {
    if (!isEditing || !ref.current) return;
    ref.current.style.height = "auto";
    ref.current.style.height = ref.current.scrollHeight + "px";
  }, [isEditing, draft, ref]);
}

function buildKeyHandler(onSave, onCancel) {
  return (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSave(); }
    if (e.key === "Escape") onCancel();
  };
}

function ReadOnlyView({ value, className, style, readOnlyStyles, onStart }) {
  const combinedStyle = Object.assign({}, readOnlyStyles, style);
  return (
    <span className={`${styles.readOnly} ${className}`} onClick={onStart}
      title="Click to edit" style={combinedStyle}>
      {value}
    </span>
  );
}

function EditView({ textareaRef, draft, setDraft, onSave, onCancel, className, style, placeholder }) {
  return (
    <textarea ref={textareaRef} autoFocus className={`${styles.editTextarea} ${className}`} style={style}
      value={draft} placeholder={placeholder} rows={1}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={onSave} onKeyDown={buildKeyHandler(onSave, onCancel)} />
  );
}

/** Inline title field that switches between a read-only span and an auto-resizing textarea. */

export default function InlineTitleField({
  value, isEditing, draft, setDraft, onStart, onSave, onCancel,
  className = "", textareaClassName = "", style = {},
  placeholder = "Task title...", readOnlyStyles = {},
}) {
  const textareaRef = useRef(null);
  useAutoResize(textareaRef, isEditing, draft);
  if (!isEditing) return <ReadOnlyView value={value} className={className} style={style} readOnlyStyles={readOnlyStyles} onStart={onStart} />;
  return <EditView textareaRef={textareaRef} draft={draft} setDraft={setDraft} onSave={onSave} onCancel={onCancel} className={textareaClassName} style={style} placeholder={placeholder} />;
}
