import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './EventMenu.module.css';

export function EventMenuButton({ onEdit, onDelete }) {
    const [isOpen, setIsOpen] = useState(false);
    const [menuPos, setMenuPos] = useState(null);
    const buttonRef = useRef(null);

    const handleClick = (e) => {
        e.stopPropagation();
        const rect = buttonRef.current.getBoundingClientRect();
        setMenuPos({ top: rect.bottom + 4, left: rect.right - 100 });
        setIsOpen(true);
    };

    return (
        <>
            <button ref={buttonRef} className={styles.menuButton} onClick={handleClick}>⋯</button>
            {isOpen && <EventMenu pos={menuPos} onEdit={onEdit} onDelete={onDelete} onClose={() => setIsOpen(false)} />}
        </>
    );
}

function EventMenu({ pos, onEdit, onDelete, onClose }) {
    const menuRef = useRef(null);
    useClickOutside(menuRef, onClose);

    return createPortal(
        <div ref={menuRef} className={styles.menu} style={{ top: pos.top, left: pos.left }}>
            <MenuItem label="Edit" onClick={() => { onEdit(); onClose(); }} />
            <MenuItem label="Delete" onClick={() => { onDelete(); onClose(); }} danger />
        </div>,
        document.body
    );
}

function MenuItem({ label, onClick, danger }) {
    const className = danger ? `${styles.menuItem} ${styles.danger}` : styles.menuItem;
    return <button className={className} onClick={onClick}>{label}</button>;
}

function useClickOutside(ref, onClose) {
    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [ref, onClose]);
}
