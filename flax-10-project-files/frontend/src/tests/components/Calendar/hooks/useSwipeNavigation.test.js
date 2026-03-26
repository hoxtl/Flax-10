/**
 * Tests for useSwipeNavigation - touch/scroll gesture navigation.
 */

import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSwipeNavigation } from '../../../../components/calendar/hooks/useSwipeNavigation';

describe('useSwipeNavigation', () => {
    let container, onPrev, onNext, listeners;

    beforeEach(() => {
        vi.useFakeTimers();
        listeners = {};
        container = {
            scrollTop: 0,
            clientHeight: 500,
            scrollHeight: 500,
            addEventListener: vi.fn((type, handler) => { listeners[type] = handler; }),
            removeEventListener: vi.fn(),
        };
        onPrev = vi.fn();
        onNext = vi.fn();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('adds event listeners on mount', () => {
        renderHook(() => useSwipeNavigation({ containerRef: { current: container }, onPrev, onNext }));
        expect(container.addEventListener).toHaveBeenCalledWith('wheel', expect.any(Function), { passive: false });
        expect(container.addEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: true });
        expect(container.addEventListener).toHaveBeenCalledWith('touchend', expect.any(Function), { passive: true });
    });

    it('removes event listeners on unmount', () => {
        const { unmount } = renderHook(() => useSwipeNavigation({ containerRef: { current: container }, onPrev, onNext }));
        unmount();
        expect(container.removeEventListener).toHaveBeenCalledWith('wheel', expect.any(Function));
    });

    it('does not call callbacks when disabled', () => {
        renderHook(() => useSwipeNavigation({ containerRef: { current: container }, onPrev, onNext, enabled: false }));
        listeners.wheel?.({ deltaY: 100, preventDefault: vi.fn() });
        expect(onNext).not.toHaveBeenCalled();
    });

    it('calls onNext on wheel down at scroll boundary', () => {
        container.scrollTop = container.scrollHeight - container.clientHeight;
        renderHook(() => useSwipeNavigation({ containerRef: { current: container }, onPrev, onNext }));
        listeners.wheel?.({ deltaY: 100, preventDefault: vi.fn() });
        expect(onNext).toHaveBeenCalled();
    });

    it('calls onPrev on wheel up at scroll boundary', () => {
        container.scrollTop = 0;
        renderHook(() => useSwipeNavigation({ containerRef: { current: container }, onPrev, onNext }));
        listeners.wheel?.({ deltaY: -100, preventDefault: vi.fn() });
        expect(onPrev).toHaveBeenCalled();
    });

    it('respects cooldown period', () => {
        container.scrollTop = 0;
        renderHook(() => useSwipeNavigation({ containerRef: { current: container }, onPrev, onNext }));
        listeners.wheel?.({ deltaY: -100, preventDefault: vi.fn() });
        listeners.wheel?.({ deltaY: -100, preventDefault: vi.fn() });
        expect(onPrev).toHaveBeenCalledTimes(1);
    });

    it('handles touch gestures', () => {
        container.scrollTop = container.scrollHeight - container.clientHeight;
        renderHook(() => useSwipeNavigation({ containerRef: { current: container }, onPrev, onNext }));
        listeners.touchstart?.({ touches: [{ clientY: 200 }] });
        vi.advanceTimersByTime(100);
        listeners.touchend?.({ changedTouches: [{ clientY: 50 }] });
        expect(onNext).toHaveBeenCalled();
    });

    it('does not trigger for insufficient touch distance', () => {
        container.scrollTop = container.scrollHeight - container.clientHeight;
        renderHook(() => useSwipeNavigation({ containerRef: { current: container }, onPrev, onNext }));
        listeners.touchstart?.({ touches: [{ clientY: 200 }] });
        vi.advanceTimersByTime(100);
        listeners.touchend?.({ changedTouches: [{ clientY: 180 }] });
        expect(onNext).not.toHaveBeenCalled();
    });

    it('does nothing when containerRef is null', () => {
        renderHook(() => useSwipeNavigation({ containerRef: { current: null }, onPrev, onNext }));
        expect(container.addEventListener).not.toHaveBeenCalled();
    });

    it('does not trigger touchstart when disabled', () => {
        renderHook(() => useSwipeNavigation({ containerRef: { current: container }, onPrev, onNext, enabled: false }));
        listeners.touchstart?.({ touches: [{ clientY: 200 }] });
        listeners.touchend?.({ changedTouches: [{ clientY: 50 }] });
        expect(onNext).not.toHaveBeenCalled();
        expect(onPrev).not.toHaveBeenCalled();
    });

    it('does not trigger touchend when disabled', () => {
        renderHook(() => useSwipeNavigation({ containerRef: { current: container }, onPrev, onNext, enabled: false }));
        listeners.touchend?.({ changedTouches: [{ clientY: 50 }] });
        expect(onNext).not.toHaveBeenCalled();
    });

    it('calls onPrev on touch swipe up at scroll boundary', () => {
        container.scrollTop = 0;
        renderHook(() => useSwipeNavigation({ containerRef: { current: container }, onPrev, onNext }));
        listeners.touchstart?.({ touches: [{ clientY: 50 }] });
        vi.advanceTimersByTime(100);
        listeners.touchend?.({ changedTouches: [{ clientY: 200 }] });
        expect(onPrev).toHaveBeenCalled();
    });

    it('does not trigger touchend when touchStartRef is null', () => {
        container.scrollTop = container.scrollHeight - container.clientHeight;
        renderHook(() => useSwipeNavigation({ containerRef: { current: container }, onPrev, onNext }));
        listeners.touchend?.({ changedTouches: [{ clientY: 50 }] });
        expect(onNext).not.toHaveBeenCalled();
    });

    it('does not trigger when not at scroll boundary', () => {
        container.scrollTop = 100;
        container.scrollHeight = 1000;
        renderHook(() => useSwipeNavigation({ containerRef: { current: container }, onPrev, onNext }));
        listeners.wheel?.({ deltaY: -100, preventDefault: vi.fn() });
        expect(onPrev).not.toHaveBeenCalled();
    });

    it('does not trigger touch when velocity is too low', () => {
        container.scrollTop = container.scrollHeight - container.clientHeight;
        renderHook(() => useSwipeNavigation({ containerRef: { current: container }, onPrev, onNext }));
        listeners.touchstart?.({ touches: [{ clientY: 200 }] });
        vi.advanceTimersByTime(5000);
        listeners.touchend?.({ changedTouches: [{ clientY: 100 }] });
        expect(onNext).not.toHaveBeenCalled();
    });

    it('does not trigger touch when not at scroll boundary', () => {
        container.scrollTop = 100;
        container.scrollHeight = 1000;
        renderHook(() => useSwipeNavigation({ containerRef: { current: container }, onPrev, onNext }));
        listeners.touchstart?.({ touches: [{ clientY: 200 }] });
        vi.advanceTimersByTime(100);
        listeners.touchend?.({ changedTouches: [{ clientY: 50 }] });
        expect(onNext).not.toHaveBeenCalled();
    });
});
