import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCarouselNavigation, useCarouselGestures, useCarouselKeyboard } from '../../../../components/Society/hooks/useCarouselNavigation';

describe('useCarouselNavigation', () => {
    it('starts at initialIndex', () => {
        const { result } = renderHook(() => useCarouselNavigation(5, 2));
        expect(result.current.index).toBe(2);
    });

    it('defaults to index 0', () => {
        const { result } = renderHook(() => useCarouselNavigation(3));
        expect(result.current.index).toBe(0);
    });

    it('next increments index with wrap', () => {
        const { result } = renderHook(() => useCarouselNavigation(3));
        act(() => { result.current.next(); });
        expect(result.current.index).toBe(1);
        act(() => { result.current.next(); result.current.next(); });
        expect(result.current.index).toBe(0);
    });

    it('prev decrements index with wrap', () => {
        const { result } = renderHook(() => useCarouselNavigation(3));
        act(() => { result.current.prev(); });
        expect(result.current.index).toBe(2);
    });

    it('setIndex sets directly', () => {
        const { result } = renderHook(() => useCarouselNavigation(5));
        act(() => { result.current.setIndex(4); });
        expect(result.current.index).toBe(4);
    });
});

describe('useCarouselGestures', () => {
    it('attaches touch listeners to ref element', () => {
        const mockEl = { addEventListener: vi.fn(), removeEventListener: vi.fn() };
        const ref = { current: mockEl };
        const { unmount } = renderHook(() => useCarouselGestures(ref, { prev: vi.fn(), next: vi.fn() }));
        expect(mockEl.addEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function));
        expect(mockEl.addEventListener).toHaveBeenCalledWith('touchend', expect.any(Function));
        unmount();
        expect(mockEl.removeEventListener).toHaveBeenCalled();
    });

    it('triggers prev/next only for large swipes and ignores missing touch data', () => {
        const handlers = {};
        const mockEl = {
            addEventListener: vi.fn((name, fn) => {
                handlers[name] = fn;
            }),
            removeEventListener: vi.fn(),
        };
        const prev = vi.fn();
        const next = vi.fn();
        const ref = { current: mockEl };

        renderHook(() => useCarouselGestures(ref, { prev, next }));

        handlers.touchstart({ changedTouches: [{ clientX: 100 }] });
        handlers.touchend({ changedTouches: [{ clientX: 10 }] });
        expect(next).toHaveBeenCalledTimes(1);

        handlers.touchstart({ changedTouches: [{ clientX: 10 }] });
        handlers.touchend({ changedTouches: [{ clientX: 100 }] });
        expect(prev).toHaveBeenCalledTimes(1);

        handlers.touchstart({});
        handlers.touchend({});
        expect(prev).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledTimes(1);
    });

    it('handles null ref gracefully', () => {
        const ref = { current: null };
        expect(() => renderHook(() => useCarouselGestures(ref, { prev: vi.fn(), next: vi.fn() }))).not.toThrow();
    });
});

describe('useCarouselKeyboard', () => {
    let listeners = {};
    beforeEach(() => {
        listeners = {};
        vi.spyOn(window, 'addEventListener').mockImplementation((e, fn) => { listeners[e] = fn; });
        vi.spyOn(window, 'removeEventListener').mockImplementation(() => {});
    });
    afterEach(() => { vi.restoreAllMocks(); });

    it('calls prev on ArrowLeft', () => {
        const prev = vi.fn(), next = vi.fn();
        renderHook(() => useCarouselKeyboard(prev, next));
        listeners.keydown({ key: 'ArrowLeft' });
        expect(prev).toHaveBeenCalled();
    });

    it('calls next on ArrowRight', () => {
        const prev = vi.fn(), next = vi.fn();
        renderHook(() => useCarouselKeyboard(prev, next));
        listeners.keydown({ key: 'ArrowRight' });
        expect(next).toHaveBeenCalled();
    });

    it('calls onClose on Escape', () => {
        const prev = vi.fn(), next = vi.fn(), onClose = vi.fn();
        renderHook(() => useCarouselKeyboard(prev, next, onClose));
        listeners.keydown({ key: 'Escape' });
        expect(onClose).toHaveBeenCalled();
    });

    it('does nothing for other keys', () => {
        const prev = vi.fn(), next = vi.fn();
        renderHook(() => useCarouselKeyboard(prev, next));
        listeners.keydown({ key: 'Enter' });
        expect(prev).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });
});
