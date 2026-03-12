import { useRef, useEffect } from 'react';
import styles from '../TableView.module.css';

export function EditableCell({ value, isEditing, onChange, onKeyDown, isTextarea }) {
    const inputRef = useRef(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    if (!isEditing) {
        return <span className={styles.cellText}>{value || '—'}</span>;
    }

    if (isTextarea) {
        return (
            <textarea
                ref={inputRef}
                className={styles.cellInput}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={onKeyDown}
                rows={3}
            />
        );
    }

    return (
        <input
            ref={inputRef}
            type="text"
            className={styles.cellInput}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
        />
    );
}
