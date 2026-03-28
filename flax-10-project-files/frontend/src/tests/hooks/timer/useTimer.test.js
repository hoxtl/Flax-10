import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimer } from '../../../components/timer/hooks/useTimer';

describe('useTimer', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('initializes with default values', () => {
        const { result } = renderHook(() => useTimer(25, 5, 4));
        expect(result.current.workTime).toBe(25);
        expect(result.current.breakTime).toBe(5);
        expect(result.current.targetSessions).toBe(4);
        expect(result.current.timeLeft).toBe(1500);
        expect(result.current.isActive).toBe(false);
        expect(result.current.isPaused).toBe(false);
        expect(result.current.mode).toBe('work');
        expect(result.current.completedSessions).toBe(0);
        expect(result.current.totalWork).toBe(0);
        expect(result.current.totalBreak).toBe(0);
        expect(result.current.totalPaused).toBe(0);
    });

    it('setIsActive starts and stops the timer', () => {
        const { result } = renderHook(() => useTimer(25, 5, 4));
        act(() => result.current.setIsActive(true));
        expect(result.current.isActive).toBe(true);
        expect(result.current.isPaused).toBe(false);
        act(() => result.current.setIsActive(false));
        expect(result.current.isActive).toBe(false);
    });

    it('ticks when active', () => {
        const { result } = renderHook(() => useTimer(25, 5, 4));
        act(() => result.current.setIsActive(true));
        act(() => vi.advanceTimersByTime(3000));
        expect(result.current.timeLeft).toBe(1497);
        expect(result.current.totalWork).toBe(3);
    });

    it('does not tick when inactive', () => {
        const { result } = renderHook(() => useTimer(25, 5, 4));
        act(() => vi.advanceTimersByTime(5000));
        expect(result.current.timeLeft).toBe(1500);
    });

    it('togglePause pauses and resumes', () => {
        const { result } = renderHook(() => useTimer(25, 5, 4));
        act(() => result.current.setIsActive(true));
        act(() => result.current.togglePause());
        expect(result.current.isPaused).toBe(true);
        act(() => vi.advanceTimersByTime(2000));
        expect(result.current.totalPaused).toBe(2);
        expect(result.current.timeLeft).toBe(1500); // unchanged while paused
        act(() => result.current.togglePause());
        expect(result.current.isPaused).toBe(false);
    });

    it('resetTimer resets state to initial', () => {
        const { result } = renderHook(() => useTimer(25, 5, 4));
        act(() => result.current.setIsActive(true));
        act(() => vi.advanceTimersByTime(5000));
        act(() => result.current.resetTimer());
        expect(result.current.timeLeft).toBe(1500);
        expect(result.current.totalWork).toBe(0);
        expect(result.current.completedSessions).toBe(0);
    });

    it('setMode changes mode', () => {
        const { result } = renderHook(() => useTimer(25, 5, 4));
        act(() => result.current.setMode('break'));
        expect(result.current.mode).toBe('break');
    });

    it('setTimeLeft updates timeLeft', () => {
        const { result } = renderHook(() => useTimer(25, 5, 4));
        act(() => result.current.setTimeLeft(300));
        expect(result.current.timeLeft).toBe(300);
    });

    it('setCompletedSessions updates completedSessions and resets totalPaused', () => {
        const { result } = renderHook(() => useTimer(25, 5, 4));
        act(() => result.current.setCompletedSessions(3));
        expect(result.current.completedSessions).toBe(3);
        expect(result.current.totalPaused).toBe(0);
    });

    it('updateSettings merges settings into state', () => {
        const { result } = renderHook(() => useTimer(25, 5, 4));
        act(() => result.current.updateSettings({ workTime: 45, breakTime: 10 }));
        expect(result.current.workTime).toBe(45);
        expect(result.current.breakTime).toBe(10);
    });

    describe('updateTime', () => {
        it('updates workTime and sets timeLeft when inactive and mode=work', () => {
            const { result } = renderHook(() => useTimer(25, 5, 4));
            act(() => result.current.updateTime('work', 30));
            expect(result.current.workTime).toBe(30);
            expect(result.current.timeLeft).toBe(1800); // 30 * 60
        });

        it('updates breakTime when mode=work (no timeLeft change)', () => {
            const { result } = renderHook(() => useTimer(25, 5, 4));
            act(() => result.current.updateTime('break', 10));
            expect(result.current.breakTime).toBe(10);
            expect(result.current.timeLeft).toBe(1500); // unchanged (mode is work)
        });

        it('updates sessions count', () => {
            const { result } = renderHook(() => useTimer(25, 5, 4));
            act(() => result.current.updateTime('sessions', 6));
            expect(result.current.targetSessions).toBe(6);
        });

        it('adjusts timeLeft when active and paused (mode=work, updateTime work)', () => {
            const { result } = renderHook(() => useTimer(25, 5, 4));
            // Timer is inactive initially; activate and pause
            act(() => result.current.setIsActive(true));
            act(() => result.current.togglePause());
            // Now active and paused, mode='work'
            act(() => result.current.updateTime('work', 30)); // was 25, +5min => +300s
            expect(result.current.workTime).toBe(30);
            // timeLeft should be 1500 + (30-25)*60 = 1800
            expect(result.current.timeLeft).toBe(1800);
        });

        it('does not update timeLeft when active but not paused (mode=work)', () => {
            const { result } = renderHook(() => useTimer(25, 5, 4));
            act(() => result.current.setIsActive(true));
            // Not paused, so updateTime('work') should not change timeLeft
            const timeBefore = result.current.timeLeft;
            act(() => result.current.updateTime('work', 30));
            // timeLeft stays because active and not paused
            expect(result.current.timeLeft).toBe(timeBefore);
        });

        it('does not update timeLeft when mode does not match type', () => {
            const { result } = renderHook(() => useTimer(25, 5, 4));
            // mode='work', updating 'break' should not change timeLeft
            act(() => result.current.updateTime('break', 10));
            expect(result.current.timeLeft).toBe(1500);
        });

        it('maps unknown type to targetSessions key', () => {
            const { result } = renderHook(() => useTimer(25, 5, 4));
            act(() => result.current.updateTime('sessions', 8));
            expect(result.current.targetSessions).toBe(8);
        });
    });

    it('ticks correctly in break mode', () => {
        const { result } = renderHook(() => useTimer(25, 5, 4));
        act(() => result.current.setMode('break'));
        act(() => result.current.setIsActive(true));
        act(() => vi.advanceTimersByTime(2000));
        expect(result.current.totalBreak).toBe(2);
        expect(result.current.totalWork).toBe(0);
    });

    it('blockTotalWork and blockTotalBreak accumulate correctly', () => {
        const { result } = renderHook(() => useTimer(25, 5, 4));
        act(() => result.current.setIsActive(true));
        act(() => vi.advanceTimersByTime(3000));
        expect(result.current.blockTotalWork).toBe(3);
        act(() => result.current.setMode('break'));
        act(() => vi.advanceTimersByTime(2000));
        expect(result.current.blockTotalBreak).toBe(2);
    });
});
