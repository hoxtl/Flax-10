import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import TimerPage from '../../pages/TimerPage';
import * as historyUtils from '../../utils/historyUtils';

// Mock TreeAnimation to simplify DOM
vi.mock('../../components/Timer/TreeAnimation', () => ({
    default: ({ progress }) => <div data-testid="tree-anim">Progress: {progress}</div>
}));

describe('TimerPage Integration', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        const NotificationMock = vi.fn();
        NotificationMock.permission = 'granted';
        NotificationMock.requestPermission = vi.fn();
        vi.stubGlobal('Notification', NotificationMock);

        vi.spyOn(historyUtils, 'saveSession').mockImplementation(() => { });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
        vi.unstubAllGlobals();
    });

    it('renders initial state correctly', () => {
        render(<TimerPage />);
        expect(screen.getByText('Study Timer')).toBeInTheDocument();
        expect(screen.getByText('25:00')).toBeInTheDocument();
        expect(screen.getByText('Start')).toBeInTheDocument();
    });

    it('starts and stops the timer', () => {
        render(<TimerPage />);
        const startBtn = screen.getByText('Start');

        fireEvent.click(startBtn);
        expect(screen.getByText('Pause')).toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(1000);
        });
        expect(screen.getByText('24:59')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Pause'));
        expect(screen.getByText('Start')).toBeInTheDocument();
    });

    it('resets the timer', () => {
        render(<TimerPage />);
        fireEvent.click(screen.getByText('Start'));
        act(() => vi.advanceTimersByTime(5000));

        fireEvent.click(screen.getByText('Reset'));
        expect(screen.getByText('25:00')).toBeInTheDocument();
        expect(screen.getByText('Start')).toBeInTheDocument();
    });

    it('updates settings', () => {
        render(<TimerPage />);
        // Inputs are rendered by TimerSettings
        const inputs = screen.getAllByRole('spinbutton');
        // 0: work, 1: break, 2: sessions

        fireEvent.change(inputs[0], { target: { value: '30' } });
        expect(screen.getByText('30:00')).toBeInTheDocument();
    });

    it('shows break modal when work session finishes', () => {
        render(<TimerPage />);
        // Set work time to very small to test completion
        const inputs = screen.getAllByRole('spinbutton');
        fireEvent.change(inputs[0], { target: { value: '0' } }); // 0 mins

        fireEvent.click(screen.getByText('Start'));
        // 0 mins sets timeLeft to 0, which triggers effect immediately if active.

        act(() => {
            vi.advanceTimersByTime(100);
        });

        // Should check for modal (OvertimePopup)
        expect(screen.getByText("Time's Up!")).toBeInTheDocument();
    });

    it('enters break mode from modal', () => {
        render(<TimerPage />);
        // Trigger break modal
        const inputs = screen.getAllByRole('spinbutton');
        fireEvent.change(inputs[0], { target: { value: '0' } });
        fireEvent.click(screen.getByText('Start'));
        act(() => vi.advanceTimersByTime(100));

        fireEvent.click(screen.getByText('Start Break'));
        expect(screen.getByText('☕ Break Time')).toBeInTheDocument();
        expect(screen.getByText('05:00')).toBeInTheDocument();
    });

    it('opens history modal when history button is clicked', () => {
        render(<TimerPage />);
        const historyBtn = screen.getByLabelText('History');
        fireEvent.click(historyBtn);
        expect(screen.getByText('History')).toBeInTheDocument();
        expect(screen.getByText('No recent sessions.')).toBeInTheDocument();
    });
});
