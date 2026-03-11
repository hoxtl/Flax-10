import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as helpers from '../utils/timerTestHelpers';
import * as historyUtils from '../../components/Timer/utils/historyUtils';
import { fireEvent, screen, act } from '@testing-library/react';

vi.mock('../../components/Timer/TreeAnimation', () => ({
    default: ({ progress }) => <div data-testid="tree-anim">Progress: {progress}</div>
}));

vi.mock('../../components/Notifications/hooks/useNotify', () => ({
    useNotify: () => vi.fn(),
}));

let mockLocationState = null;
vi.mock('react-router-dom', () => ({
    useLocation: () => ({ pathname: '/timer', state: mockLocationState }),
    useNavigate: () => vi.fn(),
}));

let mockNotificationPermission = 'granted';
const mockRequestPermission = vi.fn();
vi.mock('../../components/Timer/utils/timerUtils', async () => {
    const actual = await vi.importActual('../../components/Timer/utils/timerUtils');
    return {
        ...actual,
        useNotificationPermission: () => ({ permission: mockNotificationPermission, request: mockRequestPermission }),
    };
});

const setupTests = () => {
    vi.useFakeTimers();
    helpers.mockNotifications();
    helpers.mockHistorySave();
};

const cleanupTests = () => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    mockLocationState = null;
    mockNotificationPermission = 'granted';
};

const testInitialState = () => {
    helpers.renderTimerPage();
    helpers.expectTimer('25:00');
    helpers.expectButton('Start');
};

const testStartStop = () => {
    helpers.renderTimerPage();
    helpers.clickStart();
    helpers.expectButton('Pause');
    helpers.advanceTimer(1000);
    helpers.expectTimer('24:59');
    helpers.clickPause();
    helpers.expectButton('Resume');
};

const testReset = () => {
    helpers.renderTimerPage();
    helpers.clickStart();
    helpers.advanceTimer(5000);
    helpers.clickReset();
    helpers.expectTimer('25:00');
    helpers.expectButton('Start');
};

const testSettings = () => {
    helpers.renderTimerPage();
    helpers.updateSettings(0, '30');
    helpers.expectTimer('30:00');
};

const testBreakModalShow = () => {
    helpers.renderTimerPage();
    helpers.updateSettings(0, '1');
    helpers.clickStart();
    helpers.advanceTimer(61000);
    helpers.expectButton("Start Break");
};

const testBreakModalEnter = () => {
    helpers.renderTimerPage();
    helpers.updateSettings(0, '1');
    helpers.clickStart();
    helpers.advanceTimer(61000);
    helpers.clickButton("Start Break");
    helpers.expectTimer('05:00');
};

const testHistoryModal = async () => {
    vi.useRealTimers();
    vi.spyOn(historyUtils, 'getHistory').mockResolvedValue([{ id: 1, duration: 25 }]);
    helpers.renderTimerPage();
    helpers.clickHistory();
    // Wait for modal to load data
    expect(await screen.findByText('Clear History')).toBeInTheDocument();
};

const testHistoryModalClose = async () => {
    vi.useRealTimers();
    // Mock getHistory so it doesn't crash
    vi.spyOn(historyUtils, 'getHistory').mockResolvedValue([]);
    helpers.renderTimerPage();
    helpers.clickHistory();

    // Find close button by text (×) or role
    const closeBtn = await screen.findByText('×');
    fireEvent.click(closeBtn);

    // Check if modal is closed (Clear History should not be visible)
    await screen.findByText('Start'); // Ensure we are back on main screen
    expect(screen.queryByText('Clear History')).not.toBeInTheDocument();
};

describe('TimerPage Integration', () => {
    beforeEach(setupTests);
    afterEach(cleanupTests);
    it('renders initial state correctly', testInitialState);
    it('starts and stops the timer', testStartStop);
    it('resets the timer', testReset);
    it('updates settings', testSettings);
    it('shows break modal when work session finishes', testBreakModalShow);
    it('enters break mode from modal', testBreakModalEnter);
    it('opens history modal when history button is clicked', testHistoryModal);
    it('closes history modal', testHistoryModalClose);

    it('shows Enable Notifications when permission is default and click calls request', () => {
        mockNotificationPermission = 'default';
        helpers.renderTimerPage();
        const btn = screen.getByText('Enable Notifications');
        expect(btn).toBeInTheDocument();
        fireEvent.click(btn);
        expect(mockRequestPermission).toHaveBeenCalled();
    });

    it('hides notification prompt when permission is not default', () => {
        mockNotificationPermission = 'denied';
        helpers.renderTimerPage();
        expect(screen.queryByText('Enable Notifications')).not.toBeInTheDocument();
    });

    it('shows focus transition overlay when location.state.fromTaskPlay is true', () => {
        mockLocationState = { fromTaskPlay: true };
        helpers.renderTimerPage();
        expect(screen.getByText(/Entering focus mode|Getting ready|You've got this|Almost there|Let's focus/)).toBeInTheDocument();
        const container = document.querySelector('[class*="containerFocusEntering"]');
        expect(container).toBeInTheDocument();
    });

    it('cycles focus transition messages and hides after 6s', () => {
        mockLocationState = { fromTaskPlay: true };
        helpers.renderTimerPage();
        const initialMessage = screen.getByText(/Entering focus mode|Getting ready|You've got this|Almost there|Let's focus/);
        expect(initialMessage).toBeInTheDocument();
        act(() => vi.advanceTimersByTime(1200));
        act(() => vi.advanceTimersByTime(1200));
        act(() => vi.advanceTimersByTime(4000));
        expect(screen.queryByText(/Entering focus mode|Getting ready|You've got this|Almost there|Let's focus/)).not.toBeInTheDocument();
    });

    it('useIsMobile true when window width < 900', () => {
        const origInnerWidth = window.innerWidth;
        Object.defineProperty(window, 'innerWidth', { value: 800, writable: true, configurable: true });
        helpers.renderTimerPage();
        expect(screen.getByText('View History 📜')).toBeInTheDocument();
        Object.defineProperty(window, 'innerWidth', { value: origInnerWidth, writable: true, configurable: true });
    });

    it('useIsMobile false when window width >= 900', () => {
        const origInnerWidth = window.innerWidth;
        Object.defineProperty(window, 'innerWidth', { value: 1000, writable: true, configurable: true });
        helpers.renderTimerPage();
        expect(screen.getByLabelText('History')).toBeInTheDocument();
        Object.defineProperty(window, 'innerWidth', { value: origInnerWidth, writable: true, configurable: true });
    });
});
