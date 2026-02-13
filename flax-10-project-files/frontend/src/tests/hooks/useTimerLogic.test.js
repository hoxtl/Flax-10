import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimerLogic } from '../../hooks/useTimerLogic';
import * as historyUtils from '../../utils/historyUtils';

describe('useTimerLogic Hook', () => {
    beforeEach(() => {
        global.Notification = {
            permission: 'granted',
            requestPermission: vi.fn(),
        };
        vi.spyOn(historyUtils, 'saveSession').mockImplementation(() => { });
    });

    afterEach(() => {
        delete global.Notification;
    });

    it('initializes correctly', () => {
        const { result } = renderHook(() => useTimerLogic());
        expect(result.current.timeLeft).toBe(1500);
        expect(result.current.mode).toBe('work');
        expect(result.current.isActive).toBe(false);
    });

    it('updates all settings correctly', () => {
        const { result } = renderHook(() => useTimerLogic());
        act(() => {
            result.current.updateTime('work', 30);
            result.current.updateTime('break', 10);
            result.current.updateTime('sessions', 5);
        });
        expect(result.current.workTime).toBe(30);
        expect(result.current.breakTime).toBe(10);
        expect(result.current.targetSessions).toBe(5);
    });

    it('handles goal reached logic (useTimerFlow)', () => {
        const { result } = renderHook(() => useTimerLogic());

        // Simulate almost reaching goal
        act(() => {
            // We can access underlying t methods if exposed. 
            // useTimerLogic returns ...t which includes updateTime/setCompleted
            result.current.updateTime('sessions', 2);
            result.current.setCompletedSessions(1);
        });

        // Trigger overtime break handler
        act(() => {
            result.current.handlers.overtimeBreak();
        });

        // next = 1 + 1 = 2. 2 >= 2 (target). Should set modal to goal.
        expect(result.current.modal).toBe('goal');
    });

    it('handles timer completion flow', () => {
        const { result } = renderHook(() => useTimerLogic());

        // Trigger overtime break handler
        act(() => {
            result.current.handlers.overtimeBreak();
        });

        // Should increment completed sessions
        expect(result.current.completedSessions).toBe(1);
        // Should set mode to work (if not goal)
        expect(result.current.mode).toBe('work');
        // Should reset time
        expect(result.current.timeLeft).toBe(1500);
    });

    it('handlers.break switches to break mode', () => {
        const { result } = renderHook(() => useTimerLogic());
        act(() => {
            result.current.handlers.break();
        });
        expect(result.current.mode).toBe('break');
        expect(result.current.isActive).toBe(true);
        expect(result.current.timeLeft).toBe(300); // 5 min
    });

    it('handlers.break triggers goal if last session (Skips break)', () => {
        const { result } = renderHook(() => useTimerLogic());
        act(() => {
            result.current.updateTime('sessions', 2);
            result.current.setCompletedSessions(1);
        });

        // Finishing session 2 (last one). Should skip break and go to goal.
        act(() => {
            result.current.handlers.break();
        });

        expect(result.current.modal).toBe('goal');
        expect(result.current.mode).toBe('work'); // Mode shouldn't change to break
        expect(result.current.completedSessions).toBe(2); // Should increment
    });

    it('handlers.goal resets timer', () => {
        const { result } = renderHook(() => useTimerLogic());
        act(() => {
            result.current.setCompletedSessions(5);
            result.current.handlers.goal();
        });
        expect(result.current.completedSessions).toBe(0);
        expect(result.current.timeLeft).toBe(1500);
    });
});
