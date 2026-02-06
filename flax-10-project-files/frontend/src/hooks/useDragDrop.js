import { useState, useCallback, useRef } from 'react';
import { parseDropPayload, setupDragStart, handleDragOverEffect } from '../utils/dragUtils';

/**
* Hook for making an element draggable.
* Returns props to spread onto the draggable element.
* @param {string} type - The drag type (e.g., 'EVENT', 'TAG')
* @param {object} data - The data to pass when dropped
*/
export function useDrag({ type, data }) {
    const [isDragging, setIsDragging] = useState(false);

    const onDragStart = (e) => {
        // Disable transitions to ensure immediate opacity change for the ghost image
        e.currentTarget.style.transition = 'none';
        e.currentTarget.style.opacity = '0.3';
        setupDragStart(e, type, data);

        // Defer state update
        requestAnimationFrame(() => {
            setIsDragging(true);
        });
    };

    const onDragEnd = (e) => {
        e.currentTarget.style.transition = '';
        e.currentTarget.style.opacity = '';
        setIsDragging(false);
    };

    return { dragProps: { draggable: true, onDragStart, onDragEnd }, isDragging };
}
/**
* Hook for making an element a drop target.
* Returns props to spread onto the drop zone element.
* @param {string[]} accept - Array of accepted drag types
* @param {function} onDrop - Callback when something is dropped
*/
export function useDrop({ accept, onDrop }) {
    const [isOver, setIsOver] = useState(false);
    const dragCounter = useRef(0);
    const handleDrop = (e) => {
        e.preventDefault();
        setIsOver(false);
        dragCounter.current = 0;
        const payload = parseDropPayload(e, accept);
        if (payload) onDrop(payload, e);
    };
    const dropProps = {
        onDragEnter: (e) => (e.preventDefault(), dragCounter.current++, setIsOver(true)),
        onDragOver: handleDragOverEffect,
        onDragLeave: () => (--dragCounter.current === 0 && setIsOver(false)),
        onDrop: handleDrop,
    };
    return { dropProps, isOver };
}