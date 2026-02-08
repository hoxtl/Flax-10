import { useState, useRef } from 'react';
import { parseDropPayload, setupDragStart, handleDragOverEffect } from '../utils/dragUtils';

export function useDrag({ type, data }) {
    const [isDragging, setIsDragging] = useState(false);
    const { onDragStart, onDragEnd } = createDragHandlers(type, data, setIsDragging);
    return { dragProps: { draggable: true, onDragStart, onDragEnd }, isDragging };
}

function createDragHandlers(type, data, setIsDragging) {
    const onDragStart = (e) => {
        e.currentTarget.style.transition = 'none';
        e.currentTarget.style.opacity = '0.3';
        setupDragStart(e, type, data);
        requestAnimationFrame(() => setIsDragging(true));
    };

    const onDragEnd = (e) => {
        e.currentTarget.style.transition = '';
        e.currentTarget.style.opacity = '';
        setIsDragging(false);
    };

    return { onDragStart, onDragEnd };
}

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

    const handleDragEnter = (e) => {
        e.preventDefault();
        dragCounter.current++;
        setIsOver(true);
    };

    const handleDragLeave = () => {
        dragCounter.current--;
        if (dragCounter.current === 0) setIsOver(false);
    };

    const dropProps = {
        onDragEnter: handleDragEnter,
        onDragOver: handleDragOverEffect,
        onDragLeave: handleDragLeave,
        onDrop: handleDrop,
    };

    return { dropProps, isOver };
}