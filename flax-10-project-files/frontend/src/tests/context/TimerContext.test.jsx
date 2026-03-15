import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { TimerProvider, persistTimerTask, useTimerContext } from '../../context/TimerContext';

vi.mock('../../components/Timer/hooks/useTimerLogic', () => ({
    useTimerLogic: vi.fn(() => ({
        isActive: false,
        isPaused: false,
        timeLeft: 1500,
        totalPaused: 0,
        mode: 'work',
        isOvertime: false,
        isBreakOvertime: false,
    })),
}));

describe('TimerContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();
    });

    it('throws when used outside provider', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => renderHook(() => useTimerContext())).toThrow(
            'useTimerContext must be used within TimerProvider'
        );
        consoleSpy.mockRestore();
    });

    it('provides timer data from useTimerLogic', () => {
        const wrapper = ({ children }) => <TimerProvider>{children}</TimerProvider>;
        const { result } = renderHook(() => useTimerContext(), { wrapper });
        expect(result.current.isActive).toBe(false);
        expect(result.current.timeLeft).toBe(1500);
        expect(result.current.mode).toBe('work');
    });

    it('provides setActiveTaskId function', () => {
        const wrapper = ({ children }) => <TimerProvider>{children}</TimerProvider>;
        const { result } = renderHook(() => useTimerContext(), { wrapper });
        expect(result.current.setActiveTaskId).toBeInstanceOf(Function);
    });

    it('setActiveTaskId stores id in sessionStorage', () => {
        const wrapper = ({ children }) => <TimerProvider>{children}</TimerProvider>;
        const { result } = renderHook(() => useTimerContext(), { wrapper });
        act(() => { result.current.setActiveTaskId(42); });
        expect(sessionStorage.getItem('timerTaskId')).toBe('42');
    });

    it('setActiveTaskId stores title in sessionStorage when meta has title', () => {
        const wrapper = ({ children }) => <TimerProvider>{children}</TimerProvider>;
        const { result } = renderHook(() => useTimerContext(), { wrapper });
        act(() => { result.current.setActiveTaskId(42, { title: 'My Task', categoryColor: '#ff0000' }); });
        expect(sessionStorage.getItem('timerTaskTitle')).toBe('My Task');
        expect(sessionStorage.getItem('timerTaskCategoryColor')).toBe('#ff0000');
    });

    it('setActiveTaskId with null removes sessionStorage items', () => {
        sessionStorage.setItem('timerTaskId', '42');
        sessionStorage.setItem('timerTaskTitle', 'Old Task');
        const wrapper = ({ children }) => <TimerProvider>{children}</TimerProvider>;
        const { result } = renderHook(() => useTimerContext(), { wrapper });
        act(() => { result.current.setActiveTaskId(null); });
        expect(sessionStorage.getItem('timerTaskId')).toBeNull();
        expect(sessionStorage.getItem('timerTaskTitle')).toBeNull();
    });

    it('setActiveTaskId ignores non-object meta', () => {
        const wrapper = ({ children }) => <TimerProvider>{children}</TimerProvider>;
        const { result } = renderHook(() => useTimerContext(), { wrapper });
        act(() => { result.current.setActiveTaskId(1, 'not-an-object'); });
        expect(sessionStorage.getItem('timerTaskId')).toBe('1');
    });

    it('swallows storage errors in setActiveTaskId', () => {
        const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('storage failure');
        });

        const wrapper = ({ children }) => <TimerProvider>{children}</TimerProvider>;
        const { result } = renderHook(() => useTimerContext(), { wrapper });
        expect(() => {
            act(() => { result.current.setActiveTaskId(8, { title: 'Broken storage' }); });
        }).not.toThrow();

        setItemSpy.mockRestore();
    });

    it('persistTimerTask no-ops when window is unavailable', () => {
        const storage = { setItem: vi.fn(), removeItem: vi.fn() };
        persistTimerTask(3, { title: 'Task' }, { hasWindow: false, storage });
        expect(storage.setItem).not.toHaveBeenCalled();
        expect(storage.removeItem).not.toHaveBeenCalled();
    });

    it('persistTimerTask clears keys when id is null', () => {
        const storage = { setItem: vi.fn(), removeItem: vi.fn() };
        persistTimerTask(null, null, { hasWindow: true, storage });
        expect(storage.removeItem).toHaveBeenCalledWith('timerTaskId');
        expect(storage.removeItem).toHaveBeenCalledWith('timerTaskTitle');
        expect(storage.removeItem).toHaveBeenCalledWith('timerTaskCategoryColor');
    });

    it('persistTimerTask no-ops when sessionStorage is unavailable', () => {
        const originalSessionStorage = globalThis.sessionStorage;
        Object.defineProperty(globalThis, 'sessionStorage', { value: undefined, configurable: true });

        expect(() => persistTimerTask(1, { title: 'x' }, { hasWindow: true })).not.toThrow();

        Object.defineProperty(globalThis, 'sessionStorage', { value: originalSessionStorage, configurable: true });
    });

});
