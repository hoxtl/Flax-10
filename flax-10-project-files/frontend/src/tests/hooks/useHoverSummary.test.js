
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useHoverSummary } from '../../hooks/useHoverSummary';

describe('useHoverSummary', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should initialize with summary hidden', () => {
        const { result } = renderHook(() => useHoverSummary());
        expect(result.current.showSummary).toBe(false);
        expect(result.current.isHovered).toBe(false);
    });

    it('should show summary after delay on mouse enter', () => {
        const { result } = renderHook(() => useHoverSummary(1000));

        act(() => {
            result.current.binder.onMouseEnter();
        });

        expect(result.current.isHovered).toBe(true);
        expect(result.current.showSummary).toBe(false); // Not yet

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(result.current.showSummary).toBe(true);
    });

    it('should clear timeout and hide summary on mouse leave', () => {
        const { result } = renderHook(() => useHoverSummary(1000));

        act(() => {
            result.current.binder.onMouseEnter();
            vi.advanceTimersByTime(1000);
        });

        expect(result.current.showSummary).toBe(true);

        act(() => {
            result.current.binder.onMouseLeave();
        });

        expect(result.current.isHovered).toBe(false);
        expect(result.current.showSummary).toBe(false);
    });

    it('should not show summary if mouse leaves before delay', () => {
        const { result } = renderHook(() => useHoverSummary(1000));

        act(() => {
            result.current.binder.onMouseEnter();
            vi.advanceTimersByTime(500); // Halfway
        });

        expect(result.current.showSummary).toBe(false);

        act(() => {
            result.current.binder.onMouseLeave();
            vi.advanceTimersByTime(1000); // Finish time
        });

        expect(result.current.showSummary).toBe(false);
    });
});
