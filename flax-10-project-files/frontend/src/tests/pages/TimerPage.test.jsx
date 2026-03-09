import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as helpers from '../utils/timerTestHelpers';
import * as historyUtils from '../../components/Timer/utils/historyUtils';
import { fireEvent, screen } from '@testing-library/react';

vi.mock('../../components/Timer/TreeAnimation', () => ({
    default: ({ progress }) => <div data-testid="tree-anim">Progress: {progress}</div>
}));

vi.mock('../../components/Notifications/hooks/useNotify', () => ({
    useNotify: () => vi.fn(),
}));

vi.mock('react-router-dom', () => ({
    useLocation: () => ({ pathname: '/timer', state: null }),
    useNavigate: () => vi.fn(),
}));

const setupTests = () => {
    vi.useFakeTimers();
    helpers.mockNotifications();
    helpers.mockHistorySave();
};

const cleanupTests = () => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
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
});
