/**
 * Tests for useAutoScroll - auto-scrolls calendar to current time.
 */
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAutoScroll } from '../../../../components/Calendar/hooks/useAutoScroll';
import { createMockRef, setupRAFMock, mockTime } from '../mocks/calendarMocks';

describe('useAutoScroll', () => {
    let triggerRAF, cleanup;

    beforeEach(() => {
        cleanup = mockTime(new Date(2026, 2, 15, 10, 30));
        triggerRAF = setupRAFMock();
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it('scrolls container to current time position on mount', () => {
        const ref = createMockRef();
        renderHook(() => useAutoScroll(ref, [], 'dep'));
        triggerRAF();
        expect(ref.current.scrollTop).toBeGreaterThan(0);
    });

    it('does not scroll when ref is null', () => {
        const ref = { current: null };
        renderHook(() => useAutoScroll(ref, [], 'dep'));
        expect(window.requestAnimationFrame).not.toHaveBeenCalled();
    });

    it('resets scroll flag when dependency changes', () => {
        const ref = createMockRef();
        const { rerender } = renderHook(({ dep }) => useAutoScroll(ref, [], dep), { initialProps: { dep: 'a' } });
        triggerRAF();
        rerender({ dep: 'b' });
        triggerRAF();
        expect(ref.current.scrollTop).toBeGreaterThan(0);
    });

    it('sets scrollTop to 0 when calculated position is negative', () => {
        vi.setSystemTime(new Date(2026, 2, 15, 0, 30));
        const ref = createMockRef({ scrollTop: 100 });
        renderHook(() => useAutoScroll(ref, [], 'dep'));
        triggerRAF();
        expect(ref.current.scrollTop).toBe(0);
    });
});
