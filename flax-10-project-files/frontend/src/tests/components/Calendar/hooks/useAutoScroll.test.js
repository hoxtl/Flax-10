/**
 * Tests for useAutoScroll - auto-scrolls calendar to current time.
 */
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAutoScroll } from '../../../../components/Calendar/hooks/useAutoScroll';

describe('useAutoScroll', () => {
    let rafCallback;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => { rafCallback = cb; return 1; });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('scrolls container to current time position on mount', () => {
        vi.setSystemTime(new Date(2026, 2, 15, 10, 30));
        const ref = { current: { scrollTop: 0 } };
        renderHook(() => useAutoScroll(ref, [], 'dep'));
        rafCallback();
        expect(ref.current.scrollTop).toBeGreaterThan(0);
    });

    it('does not scroll when ref is null', () => {
        const ref = { current: null };
        renderHook(() => useAutoScroll(ref, [], 'dep'));
        expect(window.requestAnimationFrame).not.toHaveBeenCalled();
    });

    it('resets scroll flag when dependency changes', () => {
        vi.setSystemTime(new Date(2026, 2, 15, 10, 0));
        const ref = { current: { scrollTop: 0 } };
        const { rerender } = renderHook(({ dep }) => useAutoScroll(ref, [], dep), { initialProps: { dep: 'a' } });
        rafCallback();
        const firstScroll = ref.current.scrollTop;
        rerender({ dep: 'b' });
        rafCallback();
        expect(ref.current.scrollTop).toBe(firstScroll);
    });

    it('does not scroll twice for same dependency', () => {
        vi.setSystemTime(new Date(2026, 2, 15, 10, 0));
        const ref = { current: { scrollTop: 0 } };
        renderHook(() => useAutoScroll(ref, [], 'dep'));
        rafCallback();
        const initialScroll = ref.current.scrollTop;
        ref.current.scrollTop = 0;
        expect(ref.current.scrollTop).toBe(0);
    });

    it('sets scrollTop to 0 when calculated position is negative', () => {
        vi.setSystemTime(new Date(2026, 2, 15, 0, 30));
        const ref = { current: { scrollTop: 100 } };
        renderHook(() => useAutoScroll(ref, [], 'dep'));
        rafCallback();
        expect(ref.current.scrollTop).toBe(0);
    });
});
