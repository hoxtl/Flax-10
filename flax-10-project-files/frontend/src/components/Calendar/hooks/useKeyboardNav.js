/**
 * useKeyboardNav - Keyboard navigation for table view cells.
 * Supports Enter to save, Escape to cancel, Tab/Shift+Tab to move.
 */
import { useState, useCallback } from 'react';

const EDITABLE_COLUMNS = ['title', 'tag', 'location', 'description'];

function createMoveNext(rowCount) {
    return (row, col) => {
        const nextCol = col + 1;
        if (nextCol < EDITABLE_COLUMNS.length) return { row, col: nextCol };
        if (row + 1 < rowCount) return { row: row + 1, col: 0 };
        return null;
    };
}

function createMovePrev() {
    return (row, col) => {
        const prevCol = col - 1;
        if (prevCol >= 0) return { row, col: prevCol };
        if (row > 0) return { row: row - 1, col: EDITABLE_COLUMNS.length - 1 };
        return null;
    };
}

function createKeyDownHandler(onSaveEdit, onCancelEdit, moveNext, movePrev, setFocusedCell) {
    return (e, row, col) => {
        if (e.key === 'Enter') { e.preventDefault(); onSaveEdit(); setFocusedCell(null); }
        else if (e.key === 'Escape') { e.preventDefault(); onCancelEdit(); setFocusedCell(null); }
        else if (e.key === 'Tab') { e.preventDefault(); onSaveEdit(); setFocusedCell(e.shiftKey ? movePrev(row, col) : moveNext(row, col)); }
    };
}

/** Hook for keyboard navigation between editable table cells. */
export function useKeyboardNav(rowCount, onStartEdit, onSaveEdit, onCancelEdit) {
    const [focusedCell, setFocusedCell] = useState(null);
    const moveNext = useCallback(createMoveNext(rowCount), [rowCount]);
    const movePrev = useCallback(createMovePrev(), []);
    const handleKeyDown = useCallback(createKeyDownHandler(onSaveEdit, onCancelEdit, moveNext, movePrev, setFocusedCell), [onSaveEdit, onCancelEdit, moveNext, movePrev]);
    return { focusedCell, handleKeyDown, EDITABLE_COLUMNS };
}
