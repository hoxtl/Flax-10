import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CalendarPage from '../../pages/Calendar/CalendarPage';

const { mockEventPopups, mockGetAnotherUserProfile } = vi.hoisted(() => ({
    mockEventPopups: vi.fn(),
    mockGetAnotherUserProfile: vi.fn(),
}));
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const mockDispatch = vi.fn();
const mockCalendarState = {
    filter: 'all',
    allEvents: [],
    selectedDate: new Date('2025-01-15'),
    viewMode: 'month',
    isLoading: false,
    sharedCalendarUserId: null,
    sharedCalendarName: '',
};

vi.mock('../../context/CalendarContext', () => ({
    useCalendar: vi.fn(() => mockCalendarState),
    useCalendarDispatch: vi.fn(() => mockDispatch),
}));

vi.mock('../../components/calendar/Calendar', () => ({
    Calendar: () => <div data-testid="calendar" />,
}));

vi.mock('../../components/calendar/CalendarHeader', () => ({
    CalendarHeader: () => <div data-testid="calendar-header" />,
}));

vi.mock('../../components/calendar/EventPopups', () => ({
    EventPopups: (props) => {
        mockEventPopups(props);
        return <div data-testid="event-popups" />;
    },
}));

vi.mock('../../components/calendar/hooks/useEventPopupListener', () => ({
    useEventPopupListener: vi.fn(),
}));

vi.mock('../../components/calendar/utils/eventUtils', () => ({
    getVisibleEventsInView: vi.fn(() => []),
}));

vi.mock('../../api/userApi', () => ({
    getAnotherUserProfile: (...args) => mockGetAnotherUserProfile(...args),
}));

import { useCalendar } from '../../context/CalendarContext';

function renderCalendarPage(initialEntries = ['/calendar']) {
    return render(
        <MemoryRouter initialEntries={initialEntries}>
            <CalendarPage />
        </MemoryRouter>
    );
}

describe('CalendarPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useCalendar.mockReturnValue(mockCalendarState);
        mockGetAnotherUserProfile.mockResolvedValue({
            name: 'Hina Patel',
            email: 'h.patel@kcl.ac.uk',
        });
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 });
    });

    it('renders calendar header', () => {
        renderCalendarPage();
        expect(screen.getByTestId('calendar-header')).toBeTruthy();
    });

    it('renders the calendar', () => {
        renderCalendarPage();
        expect(screen.getByTestId('calendar')).toBeTruthy();
    });

    it('renders the calendar page title', () => {
        renderCalendarPage();
        expect(screen.getByText('Calendar')).toBeInTheDocument();
    });

    it('renders event popups', () => {
        renderCalendarPage();
        expect(screen.getByTestId('event-popups')).toBeTruthy();
        expect(mockEventPopups).toHaveBeenCalledWith(expect.objectContaining({ allowModuleLeave: false }));
    });

    it('shows the default calendar subtitle', () => {
        renderCalendarPage();
        expect(screen.getByText(/Keep your/i)).toBeInTheDocument();
    });

    it('redirects week view to day view on mobile', async () => {
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 600 });
        useCalendar.mockReturnValue({ ...mockCalendarState, viewMode: 'week' });
        renderCalendarPage();
        // Trigger resize event
        act(() => {
            window.dispatchEvent(new Event('resize'));
        });
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_VIEW_MODE', payload: 'day' });
    });

    it('does not redirect on desktop even in week view', () => {
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 });
        useCalendar.mockReturnValue({ ...mockCalendarState, viewMode: 'week' });
        renderCalendarPage();
        expect(mockDispatch).not.toHaveBeenCalledWith({ type: 'SET_VIEW_MODE', payload: 'day' });
    });

    it('cleans up resize listener on unmount', () => {
        const removeSpy = vi.spyOn(window, 'removeEventListener');
        const { unmount } = renderCalendarPage();
        unmount();
        expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
        removeSpy.mockRestore();
    });

    it('shows the shared skeleton while calendar data is initially loading', () => {
        useCalendar.mockReturnValue({ ...mockCalendarState, isLoading: true, allEvents: [] });
        renderCalendarPage();
        expect(screen.getByTestId('calendar-skeleton')).toBeTruthy();
    });

    it('shows shared calendar banner, contact email, and enables read-only mode when viewing another user calendar', async () => {
        renderCalendarPage(['/calendar?user_id=9&shared_name=Jane%20Doe']);
        expect(await screen.findByText("Viewing Hina Patel's shared calendar")).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Back to Hina Patel's profile/i })).toBeInTheDocument();
        expect(screen.getByText('Read-only mode')).toBeInTheDocument();
        expect(screen.queryByText(/^Tip$/i)).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Contact: h\.patel@kcl\.ac\.uk/i })).toBeInTheDocument();
        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'SET_SHARED_CALENDAR_VIEW',
            payload: { userId: '9', userName: 'Jane Doe' },
        });
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_READ_ONLY', payload: true });
        expect(mockGetAnotherUserProfile).toHaveBeenCalledWith('9');
    });

    it('falls back to the shared-name query param when the shared profile request fails', async () => {
        mockGetAnotherUserProfile.mockRejectedValueOnce(new Error('offline'));

        renderCalendarPage(['/calendar?user_id=12&shared_name=Chris']);

        expect(await screen.findByText("Viewing Chris' shared calendar")).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Back to Chris' profile/i })).toBeInTheDocument();
        expect(screen.queryByText(/Contact:/i)).not.toBeInTheDocument();
    });

    it('uses the generic back label when no shared name is available and navigates to the profile', async () => {
        mockGetAnotherUserProfile.mockResolvedValueOnce(null);

        renderCalendarPage(['/calendar?user_id=17']);

        const backButton = await screen.findByRole('button', { name: 'Back to profile' });
        act(() => {
            backButton.click();
        });
        expect(mockNavigate).toHaveBeenCalledWith('/profile/17');
    });
});
