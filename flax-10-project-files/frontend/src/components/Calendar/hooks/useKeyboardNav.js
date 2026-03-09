import { useState, useCallback } from 'react';

const EDITABLE_COLUMNS = ['title', 'location', 'description'];

export function useKeyboardNav(rowCount, onStartEdit, onSaveEdit, onCancelEdit) {
    const [focusedCell, setFocusedCell] = useState(null);

    const moveNext = useCallback((row, col) => {
        const nextCol = col + 1;
        if (nextCol < EDITABLE_COLUMNS.length) {
            return { row, col: nextCol };
        }
        if (row + 1 < rowCount) {
            return { row: row + 1, col: 0 };
        }
        return null;
    }, [rowCount]);

    const movePrev = useCallback((row, col) => {
        const prevCol = col - 1;
        if (prevCol >= 0) {
            return { row, col: prevCol };
        }
        if (row > 0) {
            return { row: row - 1, col: EDITABLE_COLUMNS.length - 1 };
        }
        return null;
    }, []);

    const handleKeyDown = useCallback((e, row, col) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onSaveEdit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onCancelEdit();
        } else if (e.key === 'Tab') {
            e.preventDefault();
            onSaveEdit();
            const next = e.shiftKey ? movePrev(row, col) : moveNext(row, col);
            if (next) setFocusedCell(next);
        }
    }, [onSaveEdit, onCancelEdit, moveNext, movePrev]);

    const setFocus = useCallback((row, col) => {
        setFocusedCell({ row, col });
    }, []);

    return { focusedCell, handleKeyDown, setFocus, EDITABLE_COLUMNS };
}
