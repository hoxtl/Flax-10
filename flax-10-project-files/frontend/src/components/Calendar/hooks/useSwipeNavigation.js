import { useRef, useEffect, useCallback } from 'react';

const WHEEL_THRESHOLD = 80;
const TOUCH_DISTANCE = 60;
const TOUCH_VELOCITY = 0.25;
const COOLDOWN_MS = 400;

export function useSwipeNavigation({ containerRef, onPrev, onNext, enabled = true }) {
    const lastTriggerRef = useRef(0);
    const touchStartRef = useRef(null);

    const canTrigger = useCallback(() => {
        const now = Date.now();
        if (now - lastTriggerRef.current < COOLDOWN_MS) return false;
        lastTriggerRef.current = now;
        return true;
    }, []);

    const isAtScrollBoundary = useCallback((direction) => {
        const el = containerRef.current;
        if (!el) return false;
        if (direction === 'up') return el.scrollTop <= 0;
        return el.scrollTop + el.clientHeight >= el.scrollHeight - 5;
    }, [containerRef]);

    const handleWheel = useCallback((e) => {
        if (!enabled) return;
        const direction = e.deltaY > 0 ? 'down' : 'up';
        if (!isAtScrollBoundary(direction)) return;
        if (Math.abs(e.deltaY) < WHEEL_THRESHOLD) return;
        if (!canTrigger()) return;
        e.preventDefault();
        if (direction === 'down') onNext();
        else onPrev();
    }, [enabled, canTrigger, isAtScrollBoundary, onPrev, onNext]);

    const handleTouchStart = useCallback((e) => {
        if (!enabled) return;
        touchStartRef.current = { y: e.touches[0].clientY, time: Date.now() };
    }, [enabled]);

    const handleTouchEnd = useCallback((e) => {
        if (!enabled || !touchStartRef.current) return;
        const startY = touchStartRef.current.y;
        const startTime = touchStartRef.current.time;
        const endY = e.changedTouches[0].clientY;
        const endTime = Date.now();
        touchStartRef.current = null;

        const distance = startY - endY;
        const duration = endTime - startTime;
        const velocity = Math.abs(distance) / duration;
        const direction = distance > 0 ? 'down' : 'up';

        if (!isAtScrollBoundary(direction)) return;
        if (Math.abs(distance) < TOUCH_DISTANCE || velocity < TOUCH_VELOCITY) return;
        if (!canTrigger()) return;
        if (direction === 'down') onNext();
        else onPrev();
    }, [enabled, canTrigger, isAtScrollBoundary, onPrev, onNext]);

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
