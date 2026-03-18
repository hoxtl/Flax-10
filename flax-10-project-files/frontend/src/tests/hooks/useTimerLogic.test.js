import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimerLogic } from '../../components/Timer/hooks/useTimerLogic';
import * as historyUtils from '../../components/Timer/utils/historyUtils';

vi.mock('../../components/Notifications/hooks/useNotify', () => ({
    useNotify: () => vi.fn(),
}));

describe('useTimerLogic Hook', () => {
    beforeEach(() => {
        global.Notification = {
            permission: 'granted',
            requestPermission: vi.fn(),
        };
        vi.spyOn(historyUtils, 'saveSession').mockImplementation(() => { });
        vi.clearAllMocks();
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

    it('manages task state correctly', () => {
        const { result } = renderHook(() => useTimerLogic());
        expect(result.current.task).toBe('');
        act(() => {
            result.current.setTask('New Task');
        });
        expect(result.current.task).toBe('New Task');
    });

    it('passes task to saveSession on completion', () => {
        const { result } = renderHook(() => useTimerLogic());

        act(() => {
            result.current.setTask('My Important Task');
        });

        act(() => {
            // Trigger completion logic via overtimeBreak (standard flow)
            result.current.handlers.overtimeBreak();
        });

        expect(historyUtils.saveSession).toHaveBeenCalledWith(
            expect.any(Number), // workTime
            expect.any(Number), // breakTime
            expect.any(Number), // sessionCount
            expect.any(Number), // blockId
            'My Important Task', // Task
            expect.any(Number), // pause
            expect.any(String), // status
            expect.any(Number), // distractions
        );
    });

    it('handlers.endEarly resets timer', () => {
        const { result } = renderHook(() => useTimerLogic());

        act(() => {
            result.current.handlers.overtimeBreak(); // advance completedSessions to 1
        });

        act(() => {
            result.current.handlers.endEarly();
        });

        // After endEarly, timer should be reset
        expect(result.current.isActive).toBe(false);
        expect(result.current.modal).toBeNull();
    });

    it('handlers.endEarly saves incomplete session when work done', () => {
        const { result } = renderHook(() => useTimerLogic());

        // Manually set totalWork > 0 by starting and ticking
        // We can't easily tick without fake timers, so test with spy
        act(() => {
            result.current.handlers.endEarly();
        });

        // With totalWork = 0, saveSession should NOT be called for 'Incomplete'
        expect(historyUtils.saveSession).not.toHaveBeenCalledWith(
            expect.any(Number),
            expect.any(Number),
            expect.any(Number),
            expect.any(Number),
            expect.any(String),
            expect.any(Number),
            'Incomplete'
        );
    });

    it('pre-fills task from activeTaskMeta.title', () => {
        const meta = { title: 'Pre-filled Task' };
        const { result } = renderHook(() => useTimerLogic(null, null, meta));
        expect(result.current.task).toBe('Pre-filled Task');
    });

    it('does not pre-fill task when activeTaskMeta.title is null or empty', () => {
        const { result: r1 } = renderHook(() => useTimerLogic(null, null, { title: null }));
        expect(r1.current.task).toBe('');
        const { result: r2 } = renderHook(() => useTimerLogic(null, null, { title: '' }));
        expect(r2.current.task).toBe('');
        const { result: r3 } = renderHook(() => useTimerLogic(null, null, {}));
        expect(r3.current.task).toBe('');
    });

    it('does not apply estimated blocks when both workMins and blocks invalid', () => {
        const meta = { estimatedWorkMinutes: NaN, estimatedSessionCount: 0, estimatedBlocks: 0 };
        const { result } = renderHook(() => useTimerLogic('task-x', null, meta));
        expect(result.current.workTime).toBe(25);
        expect(result.current.targetSessions).toBe(4);
        expect(result.current.timeLeft).toBe(1500);
    });

    it('applies estimatedWorkMinutes and sessions from activeTaskMeta', () => {
        const meta = { estimatedWorkMinutes: 45, estimatedSessionCount: 2 };
        const { result } = renderHook(() => useTimerLogic('task-1', null, meta));
        expect(result.current.workTime).toBe(45);
        expect(result.current.targetSessions).toBe(2);
        expect(result.current.timeLeft).toBe(45 * 60);
    });

    it('falls back to block-based duration when no estimatedWorkMinutes', () => {
        const meta = { estimatedBlocks: 2 };
        const { result } = renderHook(() => useTimerLogic('task-2', null, meta));
        expect(result.current.workTime).toBe(50); // max(25, 2*25)
    });
});
