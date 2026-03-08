import { useEffect } from 'react';

export function useOutsideClick(open, panelRef, menuRef, taskMenuRef, fabRef, onClose, setMenuOpen, setTaskMenuId) {
    useEffect(() => {
        if (!open) return;

        function handleMouseDown(e) {
            const target = e.target;

            // Close task menu if clicking outside taskMenuRef and not a dots button
            if (taskMenuRef?.current && !taskMenuRef.current.contains(target)) {
                if (!target.closest?.('[data-task-menu-btn]')) {
                    setTaskMenuId(null);
                }
            }

            // Close menu if clicking outside menuRef
            if (menuRef?.current && !menuRef.current.contains(target)) {
                setMenuOpen(false);
            }

            // Close panel if clicking outside panelRef and outside fab
            if (
                panelRef?.current && !panelRef.current.contains(target) &&
                (!fabRef?.current || !fabRef.current.contains(target))
            ) {
                onClose();
            }
        }

        function handleKeyDown(e) {
            if (e.key === 'Escape') {
                setMenuOpen(false);
                setTaskMenuId(null);
                onClose();
            }
        }

        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open, panelRef, menuRef, taskMenuRef, fabRef, onClose, setMenuOpen, setTaskMenuId]);
}
