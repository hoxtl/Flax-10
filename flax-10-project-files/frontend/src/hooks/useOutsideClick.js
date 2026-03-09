/**
 * Hook for handling outside-click and escape-key interactions in the Dashboard panel.
 * Manages closing panel, dropdown menu, and task context menu based on click target.
 */
import { useEffect } from 'react';

/** Attaches mousedown and keydown listeners when open, cleaning up on unmount. */
export function useOutsideClick(open, panelRef, menuRef, taskMenuRef, fabRef, onClose, setMenuOpen, setTaskMenuId) {
    useEffect(() => {
        if (!open) return;
        const handleMouseDown = (e) => handleClickOutside(e, panelRef, menuRef, taskMenuRef, fabRef, onClose, setMenuOpen, setTaskMenuId);
        const handleKeyDown = (e) => { if (e.key === 'Escape') handleEscape(onClose, setMenuOpen, setTaskMenuId); };
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open, panelRef, menuRef, taskMenuRef, fabRef, onClose, setMenuOpen, setTaskMenuId]);
}

function handleClickOutside(e, panelRef, menuRef, taskMenuRef, fabRef, onClose, setMenuOpen, setTaskMenuId) {
    const { target } = e;
    if (!menuRef.current?.contains(target)) setMenuOpen(false);
    if (!taskMenuRef.current?.contains(target) && !target.closest?.('[data-task-menu-btn]')) setTaskMenuId(null);
    if (!panelRef.current?.contains(target) && !fabRef.current?.contains(target)) onClose();
}

function handleEscape(onClose, setMenuOpen, setTaskMenuId) {
    setMenuOpen(false);
    setTaskMenuId(null);
    onClose();
}
