import { render, screen, fireEvent, act } from '@testing-library/react';
import TimerPage from '../../pages/Timer/TimerPage';
import { TimerSettings } from '../../components/Timer/TimerComponents';
import * as historyUtils from '../../components/Timer/utils/historyUtils';
import { vi } from 'vitest';

import { TimerProvider } from '../../context/TimerContext';

function advanceTimeSafely() {
    try { act(() => vi.advanceTimersByTime(500)); } catch (_) {}
}

/** Renders TimerPage with necessary providers/mocks implicitly handled if needed */
export const renderTimerPage = ({ settle = true } = {}) => {
    const view = render(
        <TimerProvider>
            <TimerPage />
        </TimerProvider>
    );
    if (settle) advanceTimeSafely();
    return view;
};

/** Renders TimerSettings in isolation */
export const renderTimerSettings = (props) => render(<TimerSettings {...props} />);

export const clickButton = (text) => fireEvent.click(screen.getByText(text));

export const clickStart = () => clickButton('Start');
export const clickPause = () => clickButton('Pause');
export const clickReset = () => clickButton('Reset');
export const clickHistory = () => {
    // Mobile: "View History 📜" opens HistoryModal.
    const viewHistory = screen.queryByText(/View History/i);
    if (viewHistory) {
        fireEvent.click(viewHistory);
        return;
    }

    // Fallback: click a "History" tab/panel button (desktop).
    const buttons = screen.getAllByRole('button');
    const historyBtn = buttons.find((b) => /history/i.test(b.textContent || ''));
    if (!historyBtn) throw new Error('History button not found');
    fireEvent.click(historyBtn);
};

/** Wraps vi.advanceTimersByTime in act to handle state updates */
export const advanceTimer = (ms) => act(() => vi.advanceTimersByTime(ms));

export const expectTimer = (time) => expect(screen.getByText(time)).toBeInTheDocument();
export const expectButton = (text) => expect(screen.getByText(text)).toBeInTheDocument();

export const updateSettings = (workIndex, value) => {
    // TimerPage renders Presets by default; Settings inputs live under "Configuration".
    const existing = screen.queryAllByRole('spinbutton');
    if (!existing.length) {
        fireEvent.click(screen.getByRole('button', { name: /Configuration/i }));
        // Tabs content is animated; give it a moment for inputs to mount.
        advanceTimeSafely();
    }
    let inputs = screen.queryAllByRole('spinbutton');
    // Retry a couple times in case AnimatePresence keeps the previous panel.
    for (let i = 0; i < 3 && (!inputs.length || !inputs[workIndex]); i++) {
        advanceTimeSafely();
        inputs = screen.queryAllByRole('spinbutton');
    }
    const finalInputs = inputs;
    fireEvent.change(finalInputs[workIndex], { target: { value } });
    fireEvent.blur(finalInputs[workIndex]); // Commit change for BufferedInput
};

/** Simulate blur event, optionally changing value first to test validation */
export const blurInput = (index, value) => {
    const existing = screen.queryAllByRole('spinbutton');
    if (!existing.length) {
        fireEvent.click(screen.getByRole('button', { name: /Configuration/i }));
        advanceTimeSafely();
    }
    let inputs = screen.queryAllByRole('spinbutton');
    for (let i = 0; i < 3 && (!inputs.length || !inputs[index]); i++) {
        advanceTimeSafely();
        inputs = screen.queryAllByRole('spinbutton');
    }
    if (value !== undefined) fireEvent.change(inputs[index], { target: { value } });
    fireEvent.blur(inputs[index]);
};

/** Mock browser Notification API */
export const mockNotifications = () => {
    const NotificationMock = vi.fn();
    NotificationMock.permission = 'granted';
    NotificationMock.requestPermission = vi.fn();
    vi.stubGlobal('Notification', NotificationMock);
};

export const mockHistorySave = () => {
    vi.spyOn(historyUtils, 'saveSession').mockImplementation(() => { });
};
