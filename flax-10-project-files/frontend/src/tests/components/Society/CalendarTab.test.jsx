import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../../../components/Society/SocietyDetail/tabs/calendarTab/SyncButton', () => ({
    default: () => <div data-testid="sync-button" />,
}));

vi.mock('../../../context/CalendarContext', () => ({
    CalendarProvider: ({ children }) => <div data-testid="calendar-provider">{children}</div>,
    useEventModal: vi.fn(() => ({ openModal: vi.fn() })),
    useEventPopup: vi.fn(() => ({ openPopup: vi.fn() })),
    useCalendar: vi.fn(() => ({ selectedDate: new Date('2024-03-04') })),
    useCalendarDispatch: vi.fn(() => vi.fn()),
}));

vi.mock('../../../context/ConfirmContext', () => ({
    useConfirm: vi.fn(() => vi.fn()),
}));

vi.mock('../../../components/Calendar/MonthView/MonthView', () => ({
    MonthView: () => <div data-testid="month-view" />,
}));

vi.mock('../../../components/Calendar/header/DatePickerButton', () => ({
    DatePickerButton: () => <div data-testid="date-picker" />,
}));

vi.mock('../../../components/Calendar/utils/dateUtils', () => ({
    addMonths: vi.fn(d => d),
    formatMonthYear: vi.fn(() => 'March 2024'),
    isSameMonth: vi.fn(() => false),
}));

vi.mock('../../../components/Calendar/utils/recurrenceUtils', () => ({
    expandRecurringEvents: vi.fn(events => events),
}));

vi.mock('../../../components/Calendar/utils/eventUtils', () => ({
    hasRecurrence: vi.fn(() => false),
    extractBaseEventId: vi.fn(id => id),
}));

vi.mock('../../../components/Calendar/EventModal/EventModal', () => ({
    EventModal: () => <div data-testid="event-modal" />,
}));

vi.mock('../../../components/Calendar/EventDetailPopup', () => ({
    EventDetailPopup: () => <div data-testid="event-detail-popup" />,
}));

vi.mock('../../../components/Calendar/EventsSummaryModal/EventsSummaryModal', () => ({
    EventsSummaryModal: () => <div data-testid="events-summary-modal" />,
}));

vi.mock('../../../components/Society/SocietyDetail/tags/TagFilterBar', () => ({
    default: () => <div data-testid="tag-filter-bar" />,
}));

vi.mock('../../../components/Society/SocietyDetail/tags/TagManager', () => ({
    default: () => <div data-testid="tag-manager" />,
}));

import CalendarTab from '../../../components/Society/SocietyDetail/tabs/calendarTab/CalendarTab';

describe('CalendarTab', () => {
    it('renders within CalendarProvider', () => {
        render(<CalendarTab events={[]} editMode={false} societyId={1} isMember={true} societyName="Chess" />);
        expect(screen.getByTestId('calendar-provider')).toBeTruthy();
    });

    it('renders MonthView', () => {
        render(<CalendarTab events={[]} editMode={false} societyId={1} isMember={true} societyName="Chess" />);
        expect(screen.getByTestId('month-view')).toBeTruthy();
    });

    it('renders TagFilterBar', () => {
        render(<CalendarTab events={[]} editMode={false} societyId={1} isMember={true} societyName="Chess" />);
        expect(screen.getByTestId('tag-filter-bar')).toBeTruthy();
    });

    it('renders TagManager in editMode', () => {
        render(<CalendarTab events={[]} editMode={true} tags={[{ id: 1, label: 'Sports' }]} societyId={1} isMember={true} societyName="Chess" />);
        expect(screen.getByTestId('tag-manager')).toBeTruthy();
    });

    it('does not render TagManager when not in editMode', () => {
        render(<CalendarTab events={[]} editMode={false} societyId={1} isMember={true} societyName="Chess" />);
        expect(screen.queryByTestId('tag-manager')).toBeNull();
    });

    it('renders SyncButton for members', () => {
        render(<CalendarTab events={[]} editMode={false} societyId={1} isMember={true} societyName="Chess" />);
        expect(screen.getByTestId('sync-button')).toBeTruthy();
    });
});
