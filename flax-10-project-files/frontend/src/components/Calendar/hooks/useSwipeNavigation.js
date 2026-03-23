/**
 * useSwipeNavigation - Touch and scroll gesture detection for navigation.
 * Enables swipe and wheel-based navigation between calendar views.
 */

import { useRef, useEffect, useCallback } from 'react';

const WHEEL_THRESHOLD = 80;
const TOUCH_DISTANCE = 60;
const TOUCH_VELOCITY = 0.25;
const COOLDOWN_MS = 400;

function createCanTrigger(lastTriggerRef) {
    return () => {
        const now = Date.now();
        if (now - lastTriggerRef.current < COOLDOWN_MS) return false;
        lastTriggerRef.current = now;
        return true;
    };
}

function createScrollBoundaryChecker(containerRef) {
    return (direction) => {
        const el = containerRef.current;
        if (!el) return false;
        if (direction === 'up') return el.scrollTop <= 0;
        return el.scrollTop + el.clientHeight >= el.scrollHeight - 5;
    };
}

function createWheelHandler(enabled, canTrigger, isAtScrollBoundary, onPrev, onNext) {
    return (e) => {
        if (!enabled) return;
        const direction = e.deltaY > 0 ? 'down' : 'up';
        if (!isAtScrollBoundary(direction) || Math.abs(e.deltaY) < WHEEL_THRESHOLD || !canTrigger()) return;
        e.preventDefault();
        if (direction === 'down') onNext(); else onPrev();
    };
}

function createTouchStartHandler(enabled, touchStartRef) {
    return (e) => {
        if (!enabled) return;
        touchStartRef.current = { y: e.touches[0].clientY, time: Date.now() };
    };
}

function processTouchEnd(touchStartRef, e) {
    const startY = touchStartRef.current.y;
    const startTime = touchStartRef.current.time;
    const endY = e.changedTouches[0].clientY;
    const distance = startY - endY;
    const velocity = Math.abs(distance) / (Date.now() - startTime);
    touchStartRef.current = null;
    return { distance, velocity, direction: distance > 0 ? 'down' : 'up' };
}

function createTouchEndHandler(enabled, touchStartRef, canTrigger, isAtScrollBoundary, onPrev, onNext) {
    return (e) => {
        if (!enabled || !touchStartRef.current) return;
        const { distance, velocity, direction } = processTouchEnd(touchStartRef, e);
        if (!isAtScrollBoundary(direction) || Math.abs(distance) < TOUCH_DISTANCE || velocity < TOUCH_VELOCITY || !canTrigger()) return;
        if (direction === 'down') onNext(); else onPrev();
    };
}

function useSwipeEventListeners(containerRef, handleWheel, handleTouchStart, handleTouchEnd) {
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        el.addEventListener('wheel', handleWheel, { passive: false });
        el.addEventListener('touchstart', handleTouchStart, { passive: true });
        el.addEventListener('touchend', handleTouchEnd, { passive: true });
        return () => {
            el.removeEventListener('wheel', handleWheel);
            el.removeEventListener('touchstart', handleTouchStart);
            el.removeEventListener('touchend', handleTouchEnd);
        };
    }, [containerRef, handleWheel, handleTouchStart, handleTouchEnd]);
}

/** Hook for detecting swipe/scroll gestures and triggering navigation callbacks. */

export function useSwipeNavigation({ containerRef, onPrev, onNext, enabled = true }) {
    const lastTriggerRef = useRef(0);
    const touchStartRef = useRef(null);
    const canTrigger = useCallback(createCanTrigger(lastTriggerRef), []);
    const isAtScrollBoundary = useCallback(createScrollBoundaryChecker(containerRef), [containerRef]);
    const handleWheel = useCallback(createWheelHandler(enabled, canTrigger, isAtScrollBoundary, onPrev, onNext), [enabled, canTrigger, isAtScrollBoundary, onPrev, onNext]);
    const handleTouchStart = useCallback(createTouchStartHandler(enabled, touchStartRef), [enabled]);
    const handleTouchEnd = useCallback(createTouchEndHandler(enabled, touchStartRef, canTrigger, isAtScrollBoundary, onPrev, onNext), [enabled, canTrigger, isAtScrollBoundary, onPrev, onNext]);
    useSwipeEventListeners(containerRef, handleWheel, handleTouchStart, handleTouchEnd);
}
