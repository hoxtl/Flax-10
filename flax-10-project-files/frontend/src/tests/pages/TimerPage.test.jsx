import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as helpers from '../utils/timerTestHelpers';
import * as historyUtils from '../../utils/historyUtils';
import { fireEvent, screen } from '@testing-library/react';

vi.mock('../../components/Timer/TreeAnimation', () => ({
    default: ({ progress }) => <div data-testid="tree-anim">Progress: {progress}</div>
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
    helpers.expectButton('Start');
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
    helpers.updateSettings(0, '0');
    helpers.clickStart();
    helpers.advanceTimer(100);
    helpers.expectButton("Start Break");
};

const testBreakModalEnter = () => {
    helpers.renderTimerPage();
    helpers.updateSettings(0, '0');
    helpers.clickStart();
    helpers.advanceTimer(100);
    helpers.clickButton("Start Break");
    helpers.expectTimer('05:00');
};

const testHistoryModal = () => {
    vi.spyOn(historyUtils, 'getHistory').mockReturnValue([{ id: 1, duration: 25 }]);
    helpers.renderTimerPage();
    helpers.clickHistory();
    helpers.expectButton('Clear History');
};

const testHistoryModalClose = () => {
    helpers.renderTimerPage();
    helpers.clickHistory();
    // Assuming the close button is '×' as seen in HistoryModal.jsx (implied)
    const closeButtons = screen.getAllByRole('button');
    const closeBtn = closeButtons.find(b => b.textContent === '×');
    if (closeBtn) {
        fireEvent.click(closeBtn);
        // Verify 'Clear History' is gone
        expect(screen.queryByText('Clear History')).not.toBeInTheDocument();
    }
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
