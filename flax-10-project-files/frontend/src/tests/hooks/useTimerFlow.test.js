import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimerFlow } from '../../components/timer/hooks/useTimerFlow';
import * as historyUtils from '../../components/timer/utils/historyUtils';

vi.mock('../../components/timer/utils/timerUtils', () => ({
    useCompletionCheck: vi.fn(),
}));

describe('useTimerFlow', () => {
    const mockSetCompletedSessions = vi.fn();
    const mockUpdateSettings = vi.fn();
    const mockSetMode = vi.fn();
    const mockSetTimeLeft = vi.fn();
    const mockSetIsActive = vi.fn();
    const mockResetTimer = vi.fn();

    function getMockTimer(overrides = {}) {
        return {
            completedSessions: 0,
            targetSessions: 4,
            workTime: 25,
            totalWork: 0,
            totalBreak: 0,
            totalPaused: 0,
            task: '',
            setCompletedSessions: mockSetCompletedSessions,
            updateSettings: mockUpdateSettings,
            setMode: mockSetMode,
            setTimeLeft: mockSetTimeLeft,
            setIsActive: mockSetIsActive,
            resetTimer: mockResetTimer,
            ...overrides,
        };
    }

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(historyUtils, 'saveSession').mockResolvedValue(undefined);
    });

    it('endEarly calls save with Incomplete when totalWork > 0', async () => {
        const t = getMockTimer({ totalWork: 120, totalBreak: 30 });
        const { result } = renderHook(() => useTimerFlow(t, null));

        await act(async () => {
            result.current.endEarly();
        });

        expect(historyUtils.saveSession).toHaveBeenCalledWith(
            expect.any(Number),
            expect.any(Number),
            expect.any(Number),
            expect.any(Number),
            expect.any(String),
            expect.any(Number),
            'Incomplete'
        );
        expect(mockResetTimer).toHaveBeenCalled();
        expect(result.current.modal).toBeNull();
    });

    it('endEarly does not call save with Incomplete when totalWork is 0', async () => {
        const t = getMockTimer({ totalWork: 0 });
        const { result } = renderHook(() => useTimerFlow(t, null));

        await act(async () => {
            result.current.endEarly();
        });

        expect(historyUtils.saveSession).not.toHaveBeenCalledWith(
            expect.any(Number),
            expect.any(Number),
            expect.any(Number),
            expect.any(Number),
            expect.any(String),
            expect.any(Number),
            'Incomplete'
        );
        expect(mockResetTimer).toHaveBeenCalled();
    });

    it('startNext sets setIsActive(false) when modal is break', () => {
        const t = getMockTimer({ completedSessions: 1, targetSessions: 4 });
        const { result } = renderHook(() => useTimerFlow(t, null));

        act(() => {
            result.current.setModal('break');
        });
        act(() => {
            result.current.startNext();
        });

        expect(mockSetIsActive).toHaveBeenCalledWith(false);
        expect(mockSetMode).toHaveBeenCalledWith('work');
        expect(mockSetTimeLeft).toHaveBeenCalledWith(25 * 60);
    });

    it('startNext sets modal to goal when next >= targetSessions', () => {
        const t = getMockTimer({ completedSessions: 1, targetSessions: 2 });
        const { result } = renderHook(() => useTimerFlow(t, null));

        act(() => {
            result.current.startNext();
        });

        expect(result.current.modal).toBe('goal');
        expect(mockSetIsActive).toHaveBeenCalledWith(false);
    });

    it('resetBlockId is a function', () => {
        const t = getMockTimer();
        const { result } = renderHook(() => useTimerFlow(t, null));
        expect(typeof result.current.resetBlockId).toBe('function');
        expect(() => act(() => result.current.resetBlockId())).not.toThrow();
    });
});
