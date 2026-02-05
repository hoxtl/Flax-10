import { useState, useCallback, useRef } from 'react';

/**
 * Hook for making an element draggable.
 * Returns props to spread onto the draggable element.
 *
 * @param {string} type - The drag type (e.g., 'EVENT', 'TAG')
 * @param {object} data - The data to pass when dropped
 */
export function useDrag({ type, data }) {
    const [isDragging, setIsDragging] = useState(false);

    // When drag starts, store the type and data in the transfer object
    const handleDragStart = useCallback((e) => {
        setIsDragging(true);
        const payload = JSON.stringify({ type, data });
        e.dataTransfer.setData('application/json', payload);
        e.dataTransfer.effectAllowed = 'move';
    }, [type, data]);

    // Reset dragging state when drag ends
    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Props to spread onto the draggable element
    const dragProps = {
        draggable: true,
        onDragStart: handleDragStart,
        onDragEnd: handleDragEnd,
    };

    return { dragProps, isDragging };
}

/**
 * Hook for making an element a drop target.
 * Returns props to spread onto the drop zone element.
 *
 * @param {string[]} accept - Array of accepted drag types
 * @param {function} onDrop - Callback when something is dropped
 */
export function useDrop({ accept, onDrop }) {
    const [isOver, setIsOver] = useState(false);

    // Counter to track nested drag enter/leave events
    const dragCounterRef = useRef(0);

    // Increment counter when drag enters
    const handleDragEnter = useCallback((e) => {
        e.preventDefault();
        dragCounterRef.current++;
        setIsOver(true);
    }, []);

    // Allow drop by preventing default
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    // Decrement counter when drag leaves
    const handleDragLeave = useCallback(() => {
        dragCounterRef.current--;
        if (dragCounterRef.current === 0) {
            setIsOver(false);
        }
    }, []);

    // Handle the drop event
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        dragCounterRef.current = 0;
        setIsOver(false);

        const payload = parseDropPayload(e, accept);
        if (payload) {
            onDrop(payload, e);
        }
    }, [accept, onDrop]);

    // Props to spread onto the drop zone element
    const dropProps = {
        onDragEnter: handleDragEnter,
        onDragOver: handleDragOver,
        onDragLeave: handleDragLeave,
        onDrop: handleDrop,
    };

    return { dropProps, isOver };
}

/**
 * Parses the drop event data and validates the type.
 * Returns null if the type is not in the accept list.
 */
function parseDropPayload(e, acceptTypes) {
    try {
        const raw = e.dataTransfer.getData('application/json');
        const parsed = JSON.parse(raw);

        if (acceptTypes.includes(parsed.type)) {
            return parsed;
        }
        return null;
    } catch {
        return null;
    }
}