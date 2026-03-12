import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CalendarTab from '../../../components/Society/SocietyDetail/tabs/calendarTab/CalendarTab';
import { useEventModal } from '../../../context/CalendarContext';
import { useConfirm } from '../../../context/ConfirmContext';
import * as Mocks from './societyTestMocks';

// Mock BEFORE importing component
vi.mock('../../../context/CalendarContext', () => ({
    CalendarProvider: ({ children }) => <div data-testid="calendar-provider">{children}</div>,
    useEventModal: vi.fn(),
}));

vi.mock('../../../context/ConfirmContext', () => ({
    useConfirm: vi.fn(),
}));

vi.mock('../../../components/Society/SocietyDetail/tabs/calendarTab/SyncButton', () => ({
    default: Mocks.MockSyncButton,
}));

vi.mock('../../../components/Calendar/MonthView/MonthView', () => ({
    MonthView: Mocks.MockMonthView,
}));

vi.mock('../../../components/Calendar/EventPopover/EventPopover', () => ({
    EventPopover: Mocks.MockEventPopover,
}));

vi.mock('../../../components/Calendar/EventsSummaryModal/EventsSummaryModal', () => ({
    EventsSummaryModal: Mocks.MockSummaryModal,
}));

vi.mock('../../../components/Society/SocietyDetail/tags/TagFilterBar', () => ({
    default: Mocks.MockTagFilterBar,
}));

vi.mock('../../../components/Society/SocietyDetail/tags/TagManager', () => ({
    default: Mocks.MockTagManager,
}));

vi.mock('../../../components/Calendar/EventModal/EventModal', () => ({
    EventModal: Mocks.MockEventModal,
}));

describe('CalendarTab', () => {
    let mockModal;
    let mockConfirm;

    beforeEach(() => {
        vi.clearAllMocks();
        mockModal = { ...Mocks.mockEventModal };
        mockConfirm = vi.fn().mockResolvedValue(true);
        vi.mocked(useEventModal).mockReturnValue(mockModal);
        vi.mocked(useConfirm).mockReturnValue(mockConfirm);
    });

    it('renders basic structure', () => {
        render(<CalendarTab events={[]} societyId={1} isMember={true} />);
        expect(screen.getByTestId('calendar-provider')).toBeTruthy();
        expect(screen.getByTestId('month-view')).toBeTruthy();
    });

    it('handles event interactions', async () => {
        const onEditAnn = vi.fn();
        const events = [{ id: 1, title: 'E1', announcement: 10 }];
        const anns = [{ id: 10, title: 'A1' }];
        
        const { rerender } = render(
            <CalendarTab events={events} editMode={false} onEditAnnouncement={onEditAnn} announcements={anns} />
        );

        fireEvent.click(screen.getByText('E1-click'));
        expect(screen.getByTestId('event-popover')).toBeTruthy();

        rerender(<CalendarTab events={events} editMode={true} onEditAnnouncement={onEditAnn} announcements={anns} />);
        fireEvent.click(screen.getByText('E1-click'));
        expect(onEditAnn).toHaveBeenCalledWith(anns[0]);
    });

    it('handles deletion and modal submission', async () => {
        const onDelete = vi.fn();
        const onAdd = vi.fn();
        const eventHandlers = { onDelete, onAdd };
        mockModal.isModalOpen = true;
        mockModal.modalEvent = { id: 1, title: 'E' };
        
        render(<CalendarTab events={[]} editMode={true} eventHandlers={eventHandlers} isMember={true} />);
        
        expect(screen.getByTestId('sync-button')).toBeTruthy();
        expect(screen.getByTestId('event-modal')).toBeTruthy();
        
        fireEvent.click(screen.getByText('delete'));
        await waitFor(() => expect(onDelete).toHaveBeenCalled());
        
        fireEvent.click(screen.getByText('submit'));
        expect(onAdd).toHaveBeenCalled();
    });
});
