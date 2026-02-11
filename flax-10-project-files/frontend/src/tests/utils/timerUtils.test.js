import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { getProgress, useCompletionCheck } from '../hooks/timerUtils';

describe('timerUtils', () => {
    describe('getProgress', () => {
        it('returns 100 for break mode', () => {
            expect(getProgress({ mode: 'break' })).toBe(100);
        });

        it('returns 100 when timeLeft is <= 0', () => {
            expect(getProgress({ mode: 'work', timeLeft: 0 })).toBe(100);
            expect(getProgress({ mode: 'work', timeLeft: -10 })).toBe(100);
        });

        it('calculates correct percentage for work mode', () => {
            // 25 mins = 1500s. 750s left = 50%
            expect(getProgress({ mode: 'work', workTime: 25, timeLeft: 750 })).toBe(50);
            // 150s elapsed of 1500s = 10% progress (90% left) => wait check logic
            // formula: ((total - left) / total) * 100
            // ((1500 - 1350) / 1500) * 100 = (150/1500)*100 = 10%
            expect(getProgress({ mode: 'work', workTime: 25, timeLeft: 1350 })).toBe(10);
        });
    });

    describe('useCompletionCheck', () => {
        it('triggers startNext or setModal when work completes', () => {
            const startNext = vi.fn();
            const setModal = vi.fn();

            // Case 1: Work complete, no break => startNext
            renderHook(() => useCompletionCheck(
                { mode: 'work', timeLeft: 0, isActive: true, breakTime: 0, setIsActive: vi.fn() },
                startNext, setModal
            ));
            expect(startNext).toHaveBeenCalled();

            // Case 2: Work complete, with break => setModal
            vi.clearAllMocks();
            renderHook(() => useCompletionCheck(
                { mode: 'work', timeLeft: 0, isActive: true, breakTime: 5, setIsActive: vi.fn() },
                startNext, setModal
            ));
            expect(setModal).toHaveBeenCalledWith('break');
        });

        it('does nothing if conditions not met', () => {
            const startNext = vi.fn();
            const setModal = vi.fn();

            renderHook(() => useCompletionCheck(
                { mode: 'work', timeLeft: 10, isActive: true, breakTime: 0 }, startNext, setModal
            ));
            expect(startNext).not.toHaveBeenCalled();
            expect(setModal).not.toHaveBeenCalled();
        });
    });
});
