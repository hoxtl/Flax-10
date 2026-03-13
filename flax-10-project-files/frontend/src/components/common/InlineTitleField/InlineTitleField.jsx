import React, { useState, useCallback, useRef, useEffect } from "react";
import styles from "./InlineTitleField.module.css";

/**
 * InlineTitleField - A reusable component for inline editing of titles.
 * Standardizes the "click to edit" -> "textarea edit" -> "save on blur/Enter" workflow.
 */
export function useInlineEdit(initialValue, onSave) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(initialValue);

  const start = useCallback(() => {
    setDraft(initialValue);
    setIsEditing(true);
  }, [initialValue]);

  const save = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== initialValue) {
      onSave?.(trimmed);
    }
    setIsEditing(false);
  }, [draft, initialValue, onSave]);

  const cancel = useCallback(() => {
    setDraft(initialValue);
    setIsEditing(false);
  }, [initialValue]);

  return { isEditing, draft, setDraft, start, save, cancel };
}

export default function InlineTitleField({
  value,
  isEditing,
  draft,
  setDraft,
  onStart,
  onSave,
  onCancel,
  className = "",
  textareaClassName = "",
  style = {},
  placeholder = "Task title...",
  readOnlyStyles = {},
}) {
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [isEditing, draft]);

  if (!isEditing) {
    return (
      <span
        className={`${styles.readOnly} ${className}`}
        onClick={onStart}
        title="Click to edit"
        style={{ ...readOnlyStyles, ...style }}
      >
        {value}
      </span>
    );
  }

  return (
    <textarea
      ref={textareaRef}
      autoFocus
      className={`${styles.editTextarea} ${textareaClassName}`}
      style={style}
      value={draft}
      placeholder={placeholder}
      rows={1}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={onSave}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          onSave();
        }
        if (e.key === "Escape") {
          onCancel();
        }
      }}
    />
  );
}
