import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockOpenModal = vi.fn();
const mockCloseModal = vi.fn();
let mockIsModalOpen = false;
let mockModalEvent = null;

vi.mock('../../../context/CalendarContext', () => ({
    CalendarProvider: ({ children }) => <div data-testid="calendar-provider">{children}</div>,
    useEventModal: () => ({
        openModal: mockOpenModal,
        closeModal: mockCloseModal,
        isModalOpen: mockIsModalOpen,
        modalEvent: mockModalEvent,
        modalInitialDate: null,
    }),
}));

vi.mock('../../../context/ConfirmContext', () => ({
    useConfirm: () => vi.fn().mockResolvedValue(true),
}));

vi.mock('../../../components/Society/SocietyDetail/tabs/calendarTab/SyncButton', () => ({
    default: () => <div data-testid="sync-button" />,
}));

vi.mock('../../../components/Calendar/MonthView/MonthView', () => ({
    MonthView: ({ events, onEventClick, onMoreClick }) => (
        <div data-testid="month-view">
            {events?.map(e => (
                <button key={e.id} onClick={(ev) => onEventClick(e, ev.target.getBoundingClientRect())}>
                    {e.title}-click
                </button>
            ))}
            <button onClick={() => onMoreClick(new Date())}>summary</button>
        </div>
    ),
}));

vi.mock('../../../components/Calendar/EventPopover/EventPopover', () => ({
    EventPopover: ({ event, actions }) => (
        <div data-testid="event-popover">
            <span>{event.title}</span>
            {actions?.map(a => <button key={a.label} onClick={a.onClick}>{a.label}</button>)}
        </div>
    ),
}));

vi.mock('../../../components/Calendar/EventsSummaryModal/EventsSummaryModal', () => ({
    EventsSummaryModal: ({ isOpen }) => isOpen ? <div data-testid="summary-modal" /> : null,
}));

vi.mock('../../../components/Society/SocietyDetail/tags/TagFilterBar', () => ({
    default: () => <div data-testid="filter-bar" />,
}));

vi.mock('../../../components/Society/SocietyDetail/tags/TagManager', () => ({
    default: () => <div data-testid="tag-manager" />,
}));

vi.mock('../../../components/Calendar/EventModal/EventModal', () => ({
    EventModal: ({ onSubmit, onDelete }) => (
        <div data-testid="event-modal">
            <button onClick={() => onSubmit({ title: 'New' })}>submit</button>
            {onDelete && <button onClick={onDelete}>delete</button>}
        </div>
    ),
}));

import CalendarTab from '../../../components/Society/SocietyDetail/tabs/calendarTab/CalendarTab';

describe('CalendarTab', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockIsModalOpen = false;
        mockModalEvent = null;
    });

    it('renders basic structure', () => {
        render(<CalendarTab events={[]} societyId={1} isMember={true} />);
        expect(screen.getByTestId('calendar-provider')).toBeTruthy();
        expect(screen.getByTestId('month-view')).toBeTruthy();
    });

    it('handles event click and shows popover', () => {
        const events = [{ id: 1, title: 'E1' }];
        render(<CalendarTab events={events} editMode={false} />);
        fireEvent.click(screen.getByText('E1-click'));
        expect(screen.getByTestId('event-popover')).toBeTruthy();
    });

    it('edit mode announcement event calls onEditAnnouncement', () => {
        const onEditAnn = vi.fn();
        const events = [{ id: 1, title: 'E1', announcement: 10 }];
        const anns = [{ id: 10, title: 'A1' }];
        render(<CalendarTab events={events} editMode={true} onEditAnnouncement={onEditAnn} announcements={anns} />);
        fireEvent.click(screen.getByText('E1-click'));
        expect(onEditAnn).toHaveBeenCalledWith(anns[0]);
    });

    it('shows sync button when member', () => {
        mockIsModalOpen = true;
        mockModalEvent = { id: 1, title: 'E' };
        render(<CalendarTab events={[]} editMode={true} eventHandlers={{}} isMember={true} />);
        expect(screen.getByTestId('sync-button')).toBeTruthy();
    });

    it('handles modal delete', async () => {
        const onDelete = vi.fn();
        mockIsModalOpen = true;
        mockModalEvent = { id: 1, title: 'E' };
        render(<CalendarTab events={[]} editMode={true} eventHandlers={{ onDelete }} />);
        fireEvent.click(screen.getByText('delete'));
        await waitFor(() => expect(onDelete).toHaveBeenCalled());
    });

    it('handles modal submit for new event', () => {
        const onAdd = vi.fn();
        mockIsModalOpen = true;
        mockModalEvent = { title: 'New' };
        render(<CalendarTab events={[]} editMode={true} eventHandlers={{ onAdd }} />);
        fireEvent.click(screen.getByText('submit'));
        expect(onAdd).toHaveBeenCalled();
    });
});
