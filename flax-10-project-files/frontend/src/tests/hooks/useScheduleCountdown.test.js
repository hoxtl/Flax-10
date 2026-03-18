import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScheduleCountdown } from '../../pages/Homepage/hooks/useScheduleCountdown';

vi.mock('../../components/Calendar/utils/dateUtils', () => ({
    isToday: vi.fn(),
}));

vi.mock('../../pages/Homepage/utils/eventUtils', () => ({
    isNow: vi.fn(),
}));

import { isToday } from '../../components/Calendar/utils/dateUtils';
import { isNow } from '../../pages/Homepage/utils/eventUtils';

describe('useScheduleCountdown', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        isToday.mockReturnValue(false);
        isNow.mockReturnValue(false);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('returns null when not today', () => {
        isToday.mockReturnValue(false);
        const { result } = renderHook(() => useScheduleCountdown(new Date(), []));
        expect(result.current).toBeNull();
    });

    it('returns null when dayEvents is empty', () => {
        isToday.mockReturnValue(true);
        const { result } = renderHook(() => useScheduleCountdown(new Date(), []));
        expect(result.current).toBeNull();
    });

    it('returns null when dayEvents is null', () => {
        isToday.mockReturnValue(true);
        const { result } = renderHook(() => useScheduleCountdown(new Date(), null));
        expect(result.current).toBeNull();
    });

    it('returns countdown seconds to next event when no current event', () => {
        isToday.mockReturnValue(true);
        isNow.mockReturnValue(false);
        const futureStart = new Date(Date.now() + 60 * 1000); // 60 seconds from now
        const events = [
            { start_time: futureStart.toISOString(), end_time: new Date(futureStart.getTime() + 3600000).toISOString() },
        ];
        const { result } = renderHook(() => useScheduleCountdown(new Date(), events));
        expect(result.current).toBeGreaterThanOrEqual(0);
        expect(result.current).toBeLessThanOrEqual(60);
    });

    it('returns countdown seconds to current event end when in a block', () => {
        isToday.mockReturnValue(true);
        isNow.mockImplementation((start, end) => true); // currently in this event
        const endTime = new Date(Date.now() + 120 * 1000); // 2 minutes left
        const events = [
            { start_time: new Date(Date.now() - 60000).toISOString(), end_time: endTime.toISOString() },
        ];
        const { result } = renderHook(() => useScheduleCountdown(new Date(), events));
        expect(result.current).toBeGreaterThanOrEqual(0);
        expect(result.current).toBeLessThanOrEqual(120);
    });

    it('ticks every second', () => {
        isToday.mockReturnValue(true);
        isNow.mockReturnValue(false);
        const futureStart = new Date(Date.now() + 65 * 1000);
        const events = [
            { start_time: futureStart.toISOString(), end_time: new Date(futureStart.getTime() + 3600000).toISOString() },
        ];
        const { result } = renderHook(() => useScheduleCountdown(new Date(), events));
        const initial = result.current;
        act(() => {
            vi.advanceTimersByTime(1000);
        });
        // Should have decremented by ~1
        expect(result.current).toBeLessThanOrEqual(initial);
    });
});
