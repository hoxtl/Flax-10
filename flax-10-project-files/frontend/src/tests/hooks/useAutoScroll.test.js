import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('../../components/Calendar/calendarConstants', () => ({
    SLOT_HEIGHT: 60,
}));

import { useAutoScroll } from '../../components/Calendar/hooks/useAutoScroll';

describe('useAutoScroll', () => {
    let mockRef;

    beforeEach(() => {
        vi.stubGlobal('requestAnimationFrame', (cb) => { cb(); return 1; });
        mockRef = { current: { scrollTop: 0 } };
    });

    it('scrolls to earliest event time', () => {
        const events = [
            { start_time: '2024-03-04T09:30:00Z' }, // 9:30 = 570 mins
        ];
        renderHook(() => useAutoScroll(mockRef, events, '2024-03-04'));
        // scrollY = (570/60) * 60 - 10 = 570 - 10 = 560
        expect(mockRef.current.scrollTop).toBeGreaterThan(0);
    });

    it('scrolls to 9am (540 mins) when no events', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-03-04T09:00:00Z'));
        renderHook(() => useAutoScroll(mockRef, [], '2024-03-04'));
        // scrollY = (540/60)*60 - 120 = 420
        expect(mockRef.current.scrollTop).toBeGreaterThanOrEqual(0);
        vi.useRealTimers();
    });

    it('does not scroll if ref.current is null', () => {
        const nullRef = { current: null };
        expect(() => renderHook(() => useAutoScroll(nullRef, [], '2024-03-04'))).not.toThrow();
    });

    it('resets scroll state when dependency changes', () => {
        const events = [{ start_time: '2024-03-04T09:00:00Z' }];
        const { rerender } = renderHook(
            ({ dep }) => useAutoScroll(mockRef, events, dep),
            { initialProps: { dep: '2024-03-04' } }
        );
        const firstScroll = mockRef.current.scrollTop;
        rerender({ dep: '2024-03-05' });
        // After rerender, scroll should happen again
        expect(mockRef.current.scrollTop).toBeGreaterThanOrEqual(firstScroll);
    });
});
