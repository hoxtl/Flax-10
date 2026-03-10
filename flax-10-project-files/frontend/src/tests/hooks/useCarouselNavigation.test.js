import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, fireEvent } from '@testing-library/react';
import { useCarouselNavigation, useCarouselKeyboard } from '../../components/Society/hooks/useCarouselNavigation';

describe('useCarouselNavigation', () => {
    it('initializes with given index', () => {
        const { result } = renderHook(() => useCarouselNavigation(5, 2));
        expect(result.current.index).toBe(2);
    });

    it('next increments index', () => {
        const { result } = renderHook(() => useCarouselNavigation(5, 0));
        act(() => { result.current.next(); });
        expect(result.current.index).toBe(1);
    });

    it('next wraps around at end', () => {
        const { result } = renderHook(() => useCarouselNavigation(3, 2));
        act(() => { result.current.next(); });
        expect(result.current.index).toBe(0);
    });

    it('prev decrements index', () => {
        const { result } = renderHook(() => useCarouselNavigation(5, 2));
        act(() => { result.current.prev(); });
        expect(result.current.index).toBe(1);
    });

    it('prev wraps around at start', () => {
        const { result } = renderHook(() => useCarouselNavigation(3, 0));
        act(() => { result.current.prev(); });
        expect(result.current.index).toBe(2);
    });

    it('setIndex updates index directly', () => {
        const { result } = renderHook(() => useCarouselNavigation(5, 0));
        act(() => { result.current.setIndex(3); });
        expect(result.current.index).toBe(3);
    });
});

describe('useCarouselKeyboard', () => {
    it('calls prev on ArrowLeft', () => {
        const prev = vi.fn();
        const next = vi.fn();
        renderHook(() => useCarouselKeyboard(prev, next, null));
        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
        });
        expect(prev).toHaveBeenCalled();
    });

    it('calls next on ArrowRight', () => {
        const prev = vi.fn();
        const next = vi.fn();
        renderHook(() => useCarouselKeyboard(prev, next, null));
        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
        });
        expect(next).toHaveBeenCalled();
    });

    it('calls onClose on Escape', () => {
        const prev = vi.fn();
        const next = vi.fn();
        const onClose = vi.fn();
        renderHook(() => useCarouselKeyboard(prev, next, onClose));
        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        });
        expect(onClose).toHaveBeenCalled();
    });

    it('removes listener on unmount', () => {
        const removeSpy = vi.spyOn(window, 'removeEventListener');
        const { unmount } = renderHook(() => useCarouselKeyboard(vi.fn(), vi.fn(), null));
        unmount();
        expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
        removeSpy.mockRestore();
    });
});
