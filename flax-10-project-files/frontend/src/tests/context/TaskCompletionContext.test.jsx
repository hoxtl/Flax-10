import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, act, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { TaskCompletionProvider, useTaskCompletion } from '../../context/TaskCompletionContext';

vi.mock('framer-motion', () => ({
    AnimatePresence: ({ children }) => <>{children}</>,
    motion: new Proxy({}, {
        get: (_, tag) => ({ children, ...props }) => {
            const Tag = typeof tag === 'string' ? tag : 'div';
            const { animate, exit, initial, transition, ...rest } = props;
            return <Tag {...rest}>{children}</Tag>;
        },
    }),
}));

describe('TaskCompletionContext', () => {
    let mockPlay;

    beforeEach(() => {
        mockPlay = vi.fn().mockResolvedValue(undefined);
        // Use a constructor function so `new Audio()` sets this.play = mockPlay
        vi.stubGlobal('Audio', function() {
            this.play = mockPlay;
            this.volume = 0;
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    it('useTaskCompletion returns no-op when used outside provider', () => {
        const { result } = renderHook(() => useTaskCompletion());
        expect(result.current.showCompletionToast).toBeInstanceOf(Function);
        expect(() => result.current.showCompletionToast()).not.toThrow();
    });

    it('showCompletionToast displays toast message', async () => {
        const wrapper = ({ children }) => <TaskCompletionProvider>{children}</TaskCompletionProvider>;
        const { result } = renderHook(() => useTaskCompletion(), { wrapper });
        act(() => { result.current.showCompletionToast('Great work!'); });
        await waitFor(() => expect(screen.getAllByText('Great work!').length).toBeGreaterThan(0));
    });

    it('toast disappears after 2 seconds', async () => {
        vi.useFakeTimers();
        const wrapper = ({ children }) => <TaskCompletionProvider>{children}</TaskCompletionProvider>;
        const { result } = renderHook(() => useTaskCompletion(), { wrapper });
        act(() => { result.current.showCompletionToast('Done!'); });
        expect(screen.queryByText('Done!')).toBeTruthy();
        act(() => {
            vi.advanceTimersByTime(2200);
            vi.runAllTimers();
        });
<<<<<<< HEAD
        expect(screen.queryByText('Done!')).toBeNull();
        vi.useRealTimers();
=======
        return waitFor(() => expect(screen.queryByText('Done!')).toBeNull()).finally(() => {
            vi.useRealTimers();
        });
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    });

    it('plays sound for non-routine tasks', () => {
        const wrapper = ({ children }) => <TaskCompletionProvider>{children}</TaskCompletionProvider>;
        const { result } = renderHook(() => useTaskCompletion(), { wrapper });
        act(() => { result.current.showCompletionToast('Done!', { isRoutine: false }); });
        expect(mockPlay).toHaveBeenCalled();
    });

    it('does not play sound for routine tasks', () => {
        const mockPlayRef = mockPlay;
        const wrapper = ({ children }) => <TaskCompletionProvider>{children}</TaskCompletionProvider>;
        const { result } = renderHook(() => useTaskCompletion(), { wrapper });
        act(() => { result.current.showCompletionToast('Done!', { isRoutine: true }); });
        expect(mockPlayRef).not.toHaveBeenCalled();
    });

    it('shows default message when none provided', () => {
        const wrapper = ({ children }) => <TaskCompletionProvider>{children}</TaskCompletionProvider>;
        const { result } = renderHook(() => useTaskCompletion(), { wrapper });
        act(() => { result.current.showCompletionToast(); });
        expect(screen.queryByText('Task complete.')).toBeTruthy();
    });

    it('toast has role status for accessibility', () => {
        const wrapper = ({ children }) => <TaskCompletionProvider>{children}</TaskCompletionProvider>;
        const { result } = renderHook(() => useTaskCompletion(), { wrapper });
        act(() => { result.current.showCompletionToast('Test'); });
        expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
    });

    it('clears previous timeout when toast is shown again', () => {
        vi.useFakeTimers();
        const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
        const wrapper = ({ children }) => <TaskCompletionProvider>{children}</TaskCompletionProvider>;
        const { result } = renderHook(() => useTaskCompletion(), { wrapper });
        act(() => { result.current.showCompletionToast('First'); });
        act(() => { result.current.showCompletionToast('Second'); });
        expect(clearTimeoutSpy).toHaveBeenCalled();
        clearTimeoutSpy.mockRestore();
        vi.useRealTimers();
    });

    it('cleans up timeout on unmount', () => {
        vi.useFakeTimers();
        const wrapper = ({ children }) => <TaskCompletionProvider>{children}</TaskCompletionProvider>;
        const { result, unmount } = renderHook(() => useTaskCompletion(), { wrapper });
        act(() => { result.current.showCompletionToast('Test'); });
        unmount();
        vi.useRealTimers();
    });

    it('falls back to the backup sound when the primary sound playback rejects', async () => {
        const playCalls = [];
        vi.stubGlobal('Audio', function(src) {
            this.src = src;
            this.volume = 0;
            this.play = vi.fn(() => {
                playCalls.push(src);
                return Promise.reject(new Error(`failed: ${src}`));
            });
        });

        const wrapper = ({ children }) => <TaskCompletionProvider>{children}</TaskCompletionProvider>;
        const { result } = renderHook(() => useTaskCompletion(), { wrapper });

        await act(async () => {
            result.current.showCompletionToast('Fallback');
            await Promise.resolve();
            await Promise.resolve();
        });

        expect(playCalls).toEqual([
            '/completion-pop.mp3',
            'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
        ]);
    });

    it('unmounts cleanly even when no completion timer has been created', () => {
        const wrapper = ({ children }) => <TaskCompletionProvider>{children}</TaskCompletionProvider>;
        const { unmount } = renderHook(() => useTaskCompletion(), { wrapper });
        expect(() => unmount()).not.toThrow();
    });
});
