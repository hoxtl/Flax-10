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
export const clickHistory = () => fireEvent.click(screen.getByLabelText('History'));

/** Wraps vi.advanceTimersByTime in act to handle state updates */
export const advanceTimer = (ms) => act(() => vi.advanceTimersByTime(ms));

export const expectTimer = (time) => expect(screen.getByText(time)).toBeInTheDocument();
export const expectButton = (text) => expect(screen.getByText(text)).toBeInTheDocument();

export const updateSettings = (workIndex, value) => {
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[workIndex], { target: { value } });
    fireEvent.blur(inputs[workIndex]); // Commit change for BufferedInput
};

/** Simulate blur event, optionally changing value first to test validation */
export const blurInput = (index, value) => {
    const inputs = screen.getAllByRole('spinbutton');
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
