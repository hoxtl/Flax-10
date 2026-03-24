import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, renderHook } from '@testing-library/react';
import { ToastProvider, useToast } from '../../context/ToastContext';

// AppToast renders the toast message – we mock AnimatePresence to render children always
vi.mock('framer-motion', () => ({
    AnimatePresence: ({ children }) => <>{children}</>,
    motion: {
        div: ({ children, ...props }) => <div {...props}>{children}</div>,
    },
}));

// Minimal mock of AppToast so we can inspect props
vi.mock('../../components/common/AppToast/AppToast', () => ({
    default: ({ message, variant, icon, actionLabel, onClose }) => (
        <div data-testid="toast" data-variant={variant} data-icon={icon} data-action={actionLabel}>
            <span data-testid="toast-message">{message}</span>
            <button data-testid="toast-close" onClick={onClose}>Close</button>
        </div>
    ),
}));

function TestConsumer() {
    const showToast = useToast();
    return (
        <div>
            <button onClick={() => showToast('Hello toast')}>Show Default</button>
            <button onClick={() => showToast('Error toast', { variant: 'error' })}>Show Error</button>
            <button onClick={() => showToast('With icon', { icon: '🔔' })}>Show Icon</button>
            <button onClick={() => showToast('With action', { actionLabel: 'Undo', onAction: vi.fn() })}>Show Action</button>
            <button onClick={() => showToast('Short toast', { durationMs: 1000 })}>Short Toast</button>
            <button onClick={() => showToast('Long toast', { durationMs: 10000 })}>Long Toast</button>
        </div>
    );
}

describe('ToastContext', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should render without toast initially', () => {
        render(
            <ToastProvider>
                <TestConsumer />
            </ToastProvider>
        );
        expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
    });

    it('should show toast with default variant on showToast call', async () => {
        render(
            <ToastProvider>
                <TestConsumer />
            </ToastProvider>
        );
        await act(async () => { screen.getByText('Show Default').click(); });
        expect(screen.getByTestId('toast-message')).toHaveTextContent('Hello toast');
        expect(screen.getByTestId('toast')).toHaveAttribute('data-variant', 'success');
    });

    it('should show toast with error variant', async () => {
        render(
            <ToastProvider>
                <TestConsumer />
            </ToastProvider>
        );
        await act(async () => { screen.getByText('Show Error').click(); });
        expect(screen.getByTestId('toast')).toHaveAttribute('data-variant', 'error');
        expect(screen.getByTestId('toast-message')).toHaveTextContent('Error toast');
    });

    it('should show toast with custom icon', async () => {
        render(
            <ToastProvider>
                <TestConsumer />
            </ToastProvider>
        );
        await act(async () => { screen.getByText('Show Icon').click(); });
        expect(screen.getByTestId('toast')).toHaveAttribute('data-icon', '🔔');
    });

    it('should show toast with action label', async () => {
        render(
            <ToastProvider>
                <TestConsumer />
            </ToastProvider>
        );
        await act(async () => { screen.getByText('Show Action').click(); });
        expect(screen.getByTestId('toast')).toHaveAttribute('data-action', 'Undo');
    });

    it('should dismiss toast automatically after default 3200ms', async () => {
        render(
            <ToastProvider>
                <TestConsumer />
            </ToastProvider>
        );
        await act(async () => { screen.getByText('Show Default').click(); });
        expect(screen.getByTestId('toast-message')).toBeInTheDocument();
        await act(async () => { vi.advanceTimersByTime(3200); });
        expect(screen.queryByTestId('toast-message')).not.toBeInTheDocument();
    });

    it('should dismiss toast after custom durationMs', async () => {
        render(
            <ToastProvider>
                <TestConsumer />
            </ToastProvider>
        );
        await act(async () => { screen.getByText('Short Toast').click(); });
        expect(screen.getByTestId('toast-message')).toBeInTheDocument();
        await act(async () => { vi.advanceTimersByTime(999); });
        expect(screen.getByTestId('toast-message')).toBeInTheDocument();
        await act(async () => { vi.advanceTimersByTime(1); });
        expect(screen.queryByTestId('toast-message')).not.toBeInTheDocument();
    });

    it('should clear previous timer when showToast called again', async () => {
        render(
            <ToastProvider>
                <TestConsumer />
            </ToastProvider>
        );
        await act(async () => { screen.getByText('Show Default').click(); });
        await act(async () => { vi.advanceTimersByTime(1000); });
        // Call again before previous timer fires
        await act(async () => { screen.getByText('Show Error').click(); });
        // Advance less than full 3200ms from second toast
        await act(async () => { vi.advanceTimersByTime(2000); });
        expect(screen.getByTestId('toast-message')).toHaveTextContent('Error toast');
        // Advance remaining
        await act(async () => { vi.advanceTimersByTime(1200); });
        expect(screen.queryByTestId('toast-message')).not.toBeInTheDocument();
    });

    it('should close toast via close button', async () => {
        render(
            <ToastProvider>
                <TestConsumer />
            </ToastProvider>
        );
        await act(async () => { screen.getByText('Show Default').click(); });
        expect(screen.getByTestId('toast-message')).toBeInTheDocument();
        await act(async () => { screen.getByTestId('toast-close').click(); });
        expect(screen.queryByTestId('toast-message')).not.toBeInTheDocument();
    });

    it('should not set onAction when options.onAction is not a function', async () => {
        render(
            <ToastProvider>
                <TestConsumer />
            </ToastProvider>
        );
        // showToast without actionLabel — onAction should be null
        await act(async () => { screen.getByText('Show Default').click(); });
        expect(screen.getByTestId('toast')).toHaveAttribute('data-action', '');
    });

    it('should use null icon when no icon provided', async () => {
        render(
            <ToastProvider>
                <TestConsumer />
            </ToastProvider>
        );
        await act(async () => { screen.getByText('Show Default').click(); });
        // data-icon attribute will be empty string when null
        expect(screen.getByTestId('toast')).toHaveAttribute('data-icon', '');
    });

    it('useToast returns the showToast function', () => {
        const wrapper = ({ children }) => <ToastProvider>{children}</ToastProvider>;
        const { result } = renderHook(() => useToast(), { wrapper });
        expect(typeof result.current).toBe('function');
    });

    it('useToast returns null when used outside provider', () => {
        const { result } = renderHook(() => useToast());
        expect(result.current).toBeNull();
    });
});
