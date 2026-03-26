/**
 * useDragDrop - Drag and drop hooks for calendar event repositioning.
 * Provides useDrag for draggable sources and useDrop for drop targets.
 */
<<<<<<< HEAD

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import { useState, useRef } from 'react';
import { parseDropPayload, setupDragStart, handleDragOverEffect } from '../utils/dragUtils';

/** Hook for making an element draggable with event data. */
<<<<<<< HEAD

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
export function useDrag({ type, data }) {
    const [isDragging, setIsDragging] = useState(false);
    const handlers = createDragHandlers(type, data, setIsDragging);
    return { dragProps: { draggable: true, ...handlers }, isDragging };
}

function createDragHandlers(type, data, setIsDragging) {
    return {
        onDragStart: (e) => handleDragStart(e, type, data, setIsDragging),
        onDragEnd: (e) => handleDragEnd(e, setIsDragging)
    };
}

function handleDragStart(e, type, data, setIsDragging) {
    e.currentTarget.style.transition = 'none';
    e.currentTarget.style.opacity = '0.3';
    setupDragStart(e, type, data);
    requestAnimationFrame(() => setIsDragging(true));
}

function handleDragEnd(e, setIsDragging) {
    e.currentTarget.style.transition = '';
    e.currentTarget.style.opacity = '';
    setIsDragging(false);
}

/** Hook for making an element a drop target that accepts dragged events. */
<<<<<<< HEAD

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
export function useDrop({ accept, onDrop }) {
    const [isOver, setIsOver] = useState(false);
    const counter = useRef(0);
    const dropProps = createDropProps(setIsOver, counter, accept, onDrop);
    return { dropProps, isOver };
}

function createDropProps(setIsOver, counter, accept, onDrop) {
    return {
        onDragEnter: (e) => handleDragEnter(e, counter, setIsOver),
        onDragOver: handleDragOverEffect,
        onDragLeave: () => handleDragLeave(counter, setIsOver),
        onDrop: (e) => handleDrop(e, counter, setIsOver, accept, onDrop)
    };
}

function handleDragEnter(e, counter, setIsOver) {
    e.preventDefault();
    counter.current++;
    setIsOver(true);
}

function handleDragLeave(counter, setIsOver) {
    counter.current--;
    if (counter.current === 0) setIsOver(false);
}

function handleDrop(e, counter, setIsOver, accept, onDrop) {
    e.preventDefault();
    setIsOver(false);
    counter.current = 0;
    const payload = parseDropPayload(e, accept);
    if (payload) onDrop(payload, e);
}