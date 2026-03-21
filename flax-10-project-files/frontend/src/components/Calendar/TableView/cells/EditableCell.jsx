/**
 * EditableCell - Inline editable cell for table view.
 * Renders text display or input field based on editing state.
 */
import { useRef, useEffect } from 'react';
import styles from './EditableCell.module.css';

function useAutoFocus(isEditing) {
    const inputRef = useRef(null);
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);
    return inputRef;
}

function TextareaInput({ inputRef, value, onChange, onKeyDown }) {
    return (
        <textarea ref={inputRef} className={styles.cellInput} value={value}
            onChange={(e) => onChange(e.target.value)} onKeyDown={onKeyDown} rows={3} />
    );
}

function TextInput({ inputRef, value, onChange, onKeyDown }) {
    return (
        <input ref={inputRef} type="text" className={styles.cellInput} value={value}
            onChange={(e) => onChange(e.target.value)} onKeyDown={onKeyDown} />
    );
}

/** Renders a cell that switches between display and edit modes. */
export function EditableCell({ value, isEditing, onChange, onKeyDown, isTextarea }) {
    const inputRef = useAutoFocus(isEditing);
    if (!isEditing) return <span className={styles.cellText}>{value || '—'}</span>;
    if (isTextarea) return <TextareaInput inputRef={inputRef} value={value} onChange={onChange} onKeyDown={onKeyDown} />;
    return <TextInput inputRef={inputRef} value={value} onChange={onChange} onKeyDown={onKeyDown} />;
}
