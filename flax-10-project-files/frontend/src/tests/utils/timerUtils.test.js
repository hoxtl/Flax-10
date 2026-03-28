import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { getProgress, useCompletionCheck, useNotificationPermission } from '../../components/timer/utils/timerUtils';

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

const mockAudioContext = vi.fn(function () {
    return {
        createOscillator: mockOscillator, createGain: mockGain,
        currentTime: 0, destination: {}
    };
});

const setupMocks = () => {
    NotificationMock = vi.fn();
    vi.stubGlobal('Notification', Object.assign(NotificationMock, {
        permission: 'granted', requestPermission: vi.fn()
    }));
    vi.stubGlobal('AudioContext', mockAudioContext);
};

const testAutoAdvance = () => {
    const startNext = vi.fn();
    const notify = vi.fn();
    const setIsActive = vi.fn();

    renderHook(() => useCompletionCheck(
        { mode: 'work', timeLeft: 0, isActive: true, breakTime: 0, setIsActive },
        startNext, notify
    ));

    expect(notify).toHaveBeenCalledWith("Time's Up!", expect.any(String), expect.anything());
    expect(setIsActive).toHaveBeenCalledWith(false);
    expect(startNext).toHaveBeenCalled();
};

const testOvertime = () => {
    const startNext = vi.fn();
    const notify = vi.fn();
    const setIsActive = vi.fn();

    renderHook(() => useCompletionCheck(
        { mode: 'work', timeLeft: 0, isActive: true, breakTime: 5, setIsActive },
        startNext, notify
    ));

    expect(notify).toHaveBeenCalledWith("Time's Up!", expect.any(String), expect.anything());
    expect(setIsActive).not.toHaveBeenCalled();
    expect(startNext).not.toHaveBeenCalled();
};

const testBreakCompletion = () => {
    const startNext = vi.fn();
    const notify = vi.fn();

    renderHook(() => useCompletionCheck(
        { mode: 'break', timeLeft: 0, isActive: true }, startNext, notify
    ));

    expect(notify).toHaveBeenCalledWith("Break Over!", expect.any(String), expect.anything());
};

const testNoAction = () => {
    const startNext = vi.fn();
    const notify = vi.fn();
    renderHook(() => useCompletionCheck(
        { mode: 'work', timeLeft: 10, isActive: true, breakTime: 0 }, startNext, notify
    ));
    expect(notify).not.toHaveBeenCalled();
    expect(startNext).not.toHaveBeenCalled();
};

describe('timerUtils: useCompletionCheck', () => {
    beforeEach(setupMocks);
    afterEach(() => vi.clearAllMocks());
    it('triggers startNext when breakTime is 0 (Auto-Advance)', testAutoAdvance);

    it('triggers Notification BUT continues timer (Overtime) when breakTime > 0', testOvertime);

    it('triggers Notification when break ends', testBreakCompletion);

    it('does nothing if conditions not met', testNoAction);

    it('handles break completion when notify is null', () => {
        const startNext = vi.fn();
        renderHook(() => useCompletionCheck(
            { mode: 'break', timeLeft: 0, isActive: true }, startNext, null
        ));
        // Should not throw even without notify
        expect(startNext).not.toHaveBeenCalled();
    });

    it('handles work completion when notify is null', () => {
        const startNext = vi.fn();
        const setIsActive = vi.fn();
        renderHook(() => useCompletionCheck(
            { mode: 'work', timeLeft: 0, isActive: true, breakTime: 0, setIsActive }, startNext, null
        ));
        expect(setIsActive).toHaveBeenCalledWith(false);
        expect(startNext).toHaveBeenCalled();
    });

    it('calls onWorkComplete when a work session ends with break time remaining', () => {
        const onWorkComplete = vi.fn();
        const timer = { mode: 'work', timeLeft: 0, isActive: true, breakTime: 5, setIsActive: vi.fn() };

        renderHook(() => useCompletionCheck(timer, vi.fn(), vi.fn(), onWorkComplete));

        expect(onWorkComplete).toHaveBeenCalledWith(timer);
    });
});

describe('timerUtils: useNotificationPermission', () => {
    afterEach(() => vi.clearAllMocks());

    it('returns permission and request function when permission is granted', () => {
        vi.stubGlobal('Notification', Object.assign(vi.fn(), {
            permission: 'granted',
            requestPermission: vi.fn().mockResolvedValue('granted'),
        }));
        const { result } = renderHook(() => useNotificationPermission());
        expect(result.current.permission).toBe('granted');
        expect(typeof result.current.request).toBe('function');
        vi.unstubAllGlobals();
    });

    it('requests permission when default and updates on permission change', async () => {
        const requestPermission = vi.fn().mockResolvedValue('granted');
        vi.stubGlobal('Notification', Object.assign(vi.fn(), {
            permission: 'default',
            requestPermission,
        }));
        vi.useFakeTimers();
        const { result } = renderHook(() => useNotificationPermission());
        // The effect runs and calls requestPermission
        await act(async () => { await Promise.resolve(); });
        expect(requestPermission).toHaveBeenCalled();
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('polling detects permission change and updates state', async () => {
        const requestPermission = vi.fn().mockResolvedValue('granted');
        const NotifMock = Object.assign(vi.fn(), { permission: 'granted', requestPermission });
        vi.stubGlobal('Notification', NotifMock);
        vi.useFakeTimers();

        const { result } = renderHook(() => useNotificationPermission());
        expect(result.current.permission).toBe('granted');

        // Simulate external permission change
        NotifMock.permission = 'denied';
        global.Notification = NotifMock;
        await act(async () => { vi.advanceTimersByTime(1100); });
        expect(result.current.permission).toBe('denied');

        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('request() calls requestPermission and updates state', async () => {
        const requestPermission = vi.fn().mockResolvedValue('granted');
        vi.stubGlobal('Notification', Object.assign(vi.fn(), {
            permission: 'denied',
            requestPermission,
        }));
        const { result } = renderHook(() => useNotificationPermission());
        await act(async () => { await result.current.request(); });
        expect(requestPermission).toHaveBeenCalled();
        vi.unstubAllGlobals();
    });

    it('keeps the same permission value when polling sees no external change', async () => {
        const requestPermission = vi.fn().mockResolvedValue('granted');
        vi.stubGlobal('Notification', Object.assign(vi.fn(), {
            permission: 'granted',
            requestPermission,
        }));
        vi.useFakeTimers();

        const { result } = renderHook(() => useNotificationPermission());
        await act(async () => { vi.advanceTimersByTime(1100); });

        expect(result.current.permission).toBe('granted');

        vi.useRealTimers();
        vi.unstubAllGlobals();
    });
});
