import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, act, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { TaskCompletionProvider, useTaskCompletion } from '../../context/TaskCompletionContext';

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
        await act(async () => {
            vi.advanceTimersByTime(2200);
            vi.runAllTimers();
        });
        // Restore real timers before waitFor so DOM polling can work
        vi.useRealTimers();
        await waitFor(() => expect(screen.queryByText('Done!')).toBeNull(), { timeout: 3000 });
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
});
