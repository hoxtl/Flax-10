import { render, screen, fireEvent, act } from '@testing-library/react';
import TimerPage from '../../pages/TimerPage';
import { TimerSettings } from '../../components/Timer/TimerComponents';
import * as historyUtils from '../../utils/historyUtils';
import { vi } from 'vitest';

export const renderTimerPage = () => render(<TimerPage />);

export const renderTimerSettings = (props) => render(<TimerSettings {...props} />);

export const clickButton = (text) => fireEvent.click(screen.getByText(text));

export const clickStart = () => clickButton('Start');
export const clickPause = () => clickButton('Pause');
export const clickReset = () => clickButton('Reset');
export const clickHistory = () => fireEvent.click(screen.getByLabelText('History'));

export const advanceTimer = (ms) => act(() => vi.advanceTimersByTime(ms));

export const expectTimer = (time) => expect(screen.getByText(time)).toBeInTheDocument();
export const expectButton = (text) => expect(screen.getByText(text)).toBeInTheDocument();

export const updateSettings = (workIndex, value) => {
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[workIndex], { target: { value } });
};

export const blurInput = (index, value) => {
    const inputs = screen.getAllByRole('spinbutton');
    if (value !== undefined) fireEvent.change(inputs[index], { target: { value } });
    fireEvent.blur(inputs[index]);
};

export const mockNotifications = () => {
    const NotificationMock = vi.fn();
    NotificationMock.permission = 'granted';
    NotificationMock.requestPermission = vi.fn();
    vi.stubGlobal('Notification', NotificationMock);
};

export const mockHistorySave = () => {
    vi.spyOn(historyUtils, 'saveSession').mockImplementation(() => { });
};
