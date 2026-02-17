import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { getProgress, useCompletionCheck } from '../../hooks/timerUtils';

const testProgressBreak = () => {
    expect(getProgress({ mode: 'break' })).toBe(100);
};

const testProgressZero = () => {
    expect(getProgress({ mode: 'work', timeLeft: 0 })).toBe(100);
    expect(getProgress({ mode: 'work', timeLeft: -10 })).toBe(100);
};

const testProgressWork = () => {
    expect(getProgress({ mode: 'work', workTime: 25, timeLeft: 750 })).toBe(50);
    expect(getProgress({ mode: 'work', workTime: 25, timeLeft: 1350 })).toBe(10);
};

describe('timerUtils: getProgress', () => {
    it('returns 100 for break mode', testProgressBreak);
    it('returns 100 when timeLeft is <= 0', testProgressZero);
    it('calculates correct percentage for work mode', testProgressWork);
});

let NotificationMock;

const mockOscillator = () => ({
    connect: vi.fn(), start: vi.fn(), stop: vi.fn(),
    type: '', frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }
});

const mockGain = () => ({
    connect: vi.fn(),
    gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }
});

const mockAudioContext = () => ({
    createOscillator: mockOscillator, createGain: mockGain,
    currentTime: 0, destination: {}
});

const setupMocks = () => {
    NotificationMock = vi.fn();
    global.Notification = Object.assign(NotificationMock, {
        permission: 'granted', requestPermission: vi.fn()
    });
    global.window.AudioContext = vi.fn().mockImplementation(mockAudioContext);
};

const testAutoAdvance = () => {
    const startNext = vi.fn();
    const setModal = vi.fn();
    const setIsActive = vi.fn();

    renderHook(() => useCompletionCheck(
        { mode: 'work', timeLeft: 0, isActive: true, breakTime: 0, setIsActive },
        startNext, setModal
    ));

    expect(NotificationMock).toHaveBeenCalledWith("Time's Up!", expect.any(Object));
    expect(setIsActive).toHaveBeenCalledWith(false);
    expect(startNext).toHaveBeenCalled();
    expect(setModal).not.toHaveBeenCalled();
};

const testOvertime = () => {
    const startNext = vi.fn();
    const setModal = vi.fn();
    const setIsActive = vi.fn();

    renderHook(() => useCompletionCheck(
        { mode: 'work', timeLeft: 0, isActive: true, breakTime: 5, setIsActive },
        startNext, setModal
    ));

    expect(NotificationMock).toHaveBeenCalledWith("Time's Up!", expect.any(Object));
    expect(setIsActive).not.toHaveBeenCalled(); // Should NOT stop timer
    expect(setModal).not.toHaveBeenCalled();    // Should NOT show break modal
    expect(startNext).not.toHaveBeenCalled();
};

const testBreakCompletion = () => {
    const startNext = vi.fn();
    const setModal = vi.fn();

    renderHook(() => useCompletionCheck(
        { mode: 'break', timeLeft: 0, isActive: true }, startNext, setModal
    ));

    expect(NotificationMock).toHaveBeenCalledWith("Break Over!", expect.any(Object));
};

const testNoAction = () => {
    const startNext = vi.fn();
    const setModal = vi.fn();
    renderHook(() => useCompletionCheck(
        { mode: 'work', timeLeft: 10, isActive: true, breakTime: 0 }, startNext, setModal
    ));
    expect(NotificationMock).not.toHaveBeenCalled();
    expect(startNext).not.toHaveBeenCalled();
    expect(setModal).not.toHaveBeenCalled();
};

describe('timerUtils: useCompletionCheck', () => {
    beforeEach(setupMocks);
    afterEach(() => vi.clearAllMocks());
    it('triggers startNext when breakTime is 0 (Auto-Advance)', testAutoAdvance);
    it('triggers Notification BUT continues timer (Overtime) when breakTime > 0', testOvertime);
    it('triggers Notification when break ends', testBreakCompletion);
    it('does nothing if conditions not met', testNoAction);
});
