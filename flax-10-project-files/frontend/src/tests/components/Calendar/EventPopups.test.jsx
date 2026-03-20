import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { mockRefreshTags, mockNotify, mockLoadEvents, mockDisenrollFromModule, mockConfirm } = vi.hoisted(() => ({
    mockRefreshTags: vi.fn(),
    mockNotify: vi.fn(),
    mockLoadEvents: vi.fn(),
    mockDisenrollFromModule: vi.fn(() => Promise.resolve()),
    mockConfirm: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
}));

vi.mock('../../../context/CalendarContext', () => ({
    useEventModal: vi.fn(),
    useEventPopup: vi.fn(),
    useCalendarDispatch: vi.fn(() => vi.fn()),
}));

vi.mock('../../../components/Calendar/EventModal/EventModal', () => ({
    EventModal: ({ event, onClose }) => (
        <div data-testid="event-modal">
            <span>{event?.title || 'New Event'}</span>
            <button onClick={onClose}>Close Modal</button>
        </div>
    ),
}));

vi.mock('../../../components/Calendar/EventPopover/EventPopover', () => ({
    EventPopover: ({ event, onClose, actions }) => (
        <div data-testid="event-popup">
            <span>{event?.title}</span>
            <button onClick={onClose}>Close Popup</button>
            {actions?.map((a, i) => (
                <button key={i} data-action={a.label} onClick={a.onClick}>{a.label}</button>
            ))}
        </div>
    ),
}));

vi.mock('../../../context/TagContext', () => ({
    useTags: () => ({ getTag: vi.fn(() => null), refreshTags: mockRefreshTags }),
}));

vi.mock('../../../components/Notifications/hooks/useNotify', () => ({
    useNotify: () => mockNotify,
}));

vi.mock('../../../components/Calendar/hooks/useCalendarEvents', () => ({
    useCalendarEvents: () => ({ loadEvents: mockLoadEvents }),
    useEventActions: () => ({ removeEvent: vi.fn(), addException: vi.fn() }),
}));

vi.mock('../../../components/Calendar/utils/eventUtils', () => ({
    getEventType: vi.fn(() => 'personal'),
    hasRecurrence: vi.fn(() => false),
}));

vi.mock('../../../components/Calendar/utils/formUtils', () => ({
    executeDelete: vi.fn(),
    deleteRecurrenceOccurrence: vi.fn(),
}));

vi.mock('../../../api/societyApi', () => ({
    unsyncCalendar: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../../components/Modules/hooks/useModuleDisenrollment', () => ({
    useModuleDisenrollment: () => ({ disenrollFromModule: mockDisenrollFromModule }),
}));

vi.mock('../../../context/ConfirmContext', () => ({
    useConfirm: () => mockConfirm,
}));

import { EventPopups } from '../../../components/Calendar/EventPopups';
import { useEventModal, useEventPopup } from '../../../context/CalendarContext';
import { getEventType, hasRecurrence } from '../../../components/Calendar/utils/eventUtils';
import { unsyncCalendar } from '../../../api/societyApi';
import { executeDelete, deleteRecurrenceOccurrence } from '../../../components/Calendar/utils/formUtils';

describe('EventPopups', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockConfirm.mockResolvedValue(true);
    });
    it('renders nothing when modal closed and no popup event', () => {
        useEventModal.mockReturnValue({ isModalOpen: false, closeModal: vi.fn(), openModal: vi.fn() });
        useEventPopup.mockReturnValue({ popupEvent: null, popupAnchorRect: null, closePopup: vi.fn(), readOnly: false });
        const { container } = render(<EventPopups />);
        expect(container.firstChild).toBeNull();
    });

    it('renders EventModal when isModalOpen is true', () => {
        useEventModal.mockReturnValue({
            isModalOpen: true,
            closeModal: vi.fn(),
            openModal: vi.fn(),
            modalEvent: { id: 1, title: 'Test Event' },
            modalType: 'event',
            modalInitialDate: null,
        });
        useEventPopup.mockReturnValue({ popupEvent: null, popupAnchorRect: null, closePopup: vi.fn(), readOnly: false });
        render(<EventPopups />);
        expect(screen.getByTestId('event-modal')).toBeTruthy();
        expect(screen.getByText('Test Event')).toBeTruthy();
    });

    it('renders EventDetailPopup when popupEvent set and modal closed', () => {
        useEventModal.mockReturnValue({ isModalOpen: false, openModal: vi.fn(), closeModal: vi.fn() });
        useEventPopup.mockReturnValue({
            popupEvent: { id: 2, title: 'Popup Event', source: 'personal', tag: null },
            popupAnchorRect: { top: 0, left: 0, width: 100, height: 30 },
            closePopup: vi.fn(),
            readOnly: false,
        });
        render(<EventPopups />);
        expect(screen.getByTestId('event-popup')).toBeTruthy();
        expect(screen.getByText('Popup Event')).toBeTruthy();
    });

    it('does not render EventDetailPopup when modal is open', () => {
        useEventModal.mockReturnValue({
            isModalOpen: true,
            closeModal: vi.fn(),
            openModal: vi.fn(),
            modalEvent: { id: 1, title: 'Modal Event' },
            modalType: null,
            modalInitialDate: null,
        });
        useEventPopup.mockReturnValue({
            popupEvent: { id: 2, title: 'Popup' },
            popupAnchorRect: null,
            closePopup: vi.fn(),
            readOnly: false,
        });
        render(<EventPopups />);
        expect(screen.queryByTestId('event-popup')).toBeNull();
        expect(screen.getByTestId('event-modal')).toBeTruthy();
    });

    it('shows Edit and Delete actions for personal events', () => {
        useEventModal.mockReturnValue({ isModalOpen: false, openModal: vi.fn(), closeModal: vi.fn() });
        useEventPopup.mockReturnValue({
            popupEvent: { id: 3, title: 'Personal Event', source: 'personal', tag: null },
            popupAnchorRect: { top: 0, left: 0, width: 100, height: 30 },
            closePopup: vi.fn(),
            readOnly: false,
        });
        getEventType.mockReturnValue('personal');
        render(<EventPopups />);
        expect(screen.getByText('Edit')).toBeTruthy();
        expect(screen.getByText('Delete')).toBeTruthy();
    });

    it('shows Leave Module action for module events', () => {
        useEventModal.mockReturnValue({ isModalOpen: false, openModal: vi.fn(), closeModal: vi.fn() });
        useEventPopup.mockReturnValue({
            popupEvent: { id: 4, title: 'Module Event', source: 'module', tag: null, module: 'CS3001' },
            popupAnchorRect: { top: 0, left: 0, width: 100, height: 30 },
            closePopup: vi.fn(),
            readOnly: false,
        });
        getEventType.mockReturnValue('module');
        render(<EventPopups />);
        expect(screen.getByText('Leave Module')).toBeTruthy();
    });

    it('hides Leave Module action when module leave is disabled', () => {
        useEventModal.mockReturnValue({ isModalOpen: false, openModal: vi.fn(), closeModal: vi.fn() });
        useEventPopup.mockReturnValue({
            popupEvent: { id: 4, title: 'Module Event', source: 'module', tag: null, module: 'CS3001' },
            popupAnchorRect: { top: 0, left: 0, width: 100, height: 30 },
            closePopup: vi.fn(),
            readOnly: false,
        });
        getEventType.mockReturnValue('module');
        render(<EventPopups allowModuleLeave={false} />);
        expect(screen.queryByText('Leave Module')).not.toBeInTheDocument();
    });

    it('shows Unsync action for society events', () => {
        useEventModal.mockReturnValue({ isModalOpen: false, openModal: vi.fn(), closeModal: vi.fn() });
        useEventPopup.mockReturnValue({
            popupEvent: { id: 5, title: 'Society Event', source: 'society', tag: null, society_id: 1, society_name: 'CS Society' },
            popupAnchorRect: { top: 0, left: 0, width: 100, height: 30 },
            closePopup: vi.fn(),
            readOnly: false,
        });
        getEventType.mockReturnValue('society');
        render(<EventPopups />);
        expect(screen.getByText('Unsync')).toBeTruthy();
    });

    it('uses society tag colors for society events', () => {
        useEventModal.mockReturnValue({ isModalOpen: false, openModal: vi.fn(), closeModal: vi.fn() });
        useEventPopup.mockReturnValue({
            popupEvent: { id: 6, title: 'Soc Event', source: 'society', tag_name: 'CS', tag_color: '#ff0000', society_id: 1 },
            popupAnchorRect: { top: 0, left: 0, width: 100, height: 30 },
            closePopup: vi.fn(),
            readOnly: false,
        });
        getEventType.mockReturnValue('society');
        render(<EventPopups />);
        expect(screen.getByTestId('event-popup')).toBeTruthy();
    });

    it('shows no actions for timetable/unknown event types', () => {
        useEventModal.mockReturnValue({ isModalOpen: false, openModal: vi.fn(), closeModal: vi.fn() });
        useEventPopup.mockReturnValue({
            popupEvent: { id: 7, title: 'Timetable Event', source: 'timetable', external_id: 'ext1' },
            popupAnchorRect: { top: 0, left: 0, width: 100, height: 30 },
            closePopup: vi.fn(),
            readOnly: false,
        });
        getEventType.mockReturnValue('timetable');
        render(<EventPopups />);
        expect(screen.getByTestId('event-popup')).toBeTruthy();
        expect(screen.getByText('Timetable Event')).toBeTruthy();
        expect(screen.queryByText('Edit')).not.toBeInTheDocument();
        expect(screen.queryByText('Leave Module')).not.toBeInTheDocument();
        expect(screen.queryByText('Unsync')).not.toBeInTheDocument();
    });

    it('calls disenrollFromModule and loadEvents when Leave Module is clicked', async () => {
        useEventModal.mockReturnValue({ isModalOpen: false, openModal: vi.fn(), closeModal: vi.fn() });
        const mockClosePopup = vi.fn();
        useEventPopup.mockReturnValue({
            popupEvent: { id: 4, title: 'Module Event', source: 'module', tag: null, module: 'CS3001' },
            popupAnchorRect: { top: 0, left: 0, width: 100, height: 30 },
            closePopup: mockClosePopup,
            readOnly: false,
        });
        getEventType.mockReturnValue('module');
        render(<EventPopups />);
        fireEvent.click(screen.getByText('Leave Module'));
        await waitFor(() => {
            expect(mockDisenrollFromModule).toHaveBeenCalledWith('CS3001', mockLoadEvents);
            expect(mockClosePopup).toHaveBeenCalled();
        });
    });

    it('calls unsyncCalendar, refreshTags, loadEvents, notify when Unsync is clicked', async () => {
        useEventModal.mockReturnValue({ isModalOpen: false, openModal: vi.fn(), closeModal: vi.fn() });
        const mockClosePopup = vi.fn();
        useEventPopup.mockReturnValue({
            popupEvent: { id: 5, title: 'Society Event', source: 'society', tag: null, society_id: 1, society_name: 'CS Society' },
            popupAnchorRect: { top: 0, left: 0, width: 100, height: 30 },
            closePopup: mockClosePopup,
            readOnly: false,
        });
        getEventType.mockReturnValue('society');
        render(<EventPopups />);
        fireEvent.click(screen.getByText('Unsync'));
        await waitFor(() => {
            expect(unsyncCalendar).toHaveBeenCalledWith(1);
            expect(mockRefreshTags).toHaveBeenCalled();
            expect(mockLoadEvents).toHaveBeenCalled();
            expect(mockNotify).toHaveBeenCalledWith('Unsync Successful', 'Calendar for CS Society is now unsynced.');
            expect(mockClosePopup).toHaveBeenCalled();
        });
    });

    it('Unsync uses fallback society name when society_name is missing', async () => {
        useEventModal.mockReturnValue({ isModalOpen: false, openModal: vi.fn(), closeModal: vi.fn() });
        useEventPopup.mockReturnValue({
            popupEvent: { id: 5, title: 'Soc', source: 'society', society_id: 2, society_name: null },
            popupAnchorRect: { top: 0, left: 0, width: 100, height: 30 },
            closePopup: vi.fn(),
            readOnly: false,
        });
        getEventType.mockReturnValue('society');
        render(<EventPopups />);
        fireEvent.click(screen.getByText('Unsync'));
        await waitFor(() => {
            expect(mockNotify).toHaveBeenCalledWith('Unsync Successful', 'Calendar for this society is now unsynced.');
        });
    });

    it('recurring delete: choice true calls executeDelete', async () => {
        mockConfirm.mockResolvedValueOnce(true);
        useEventModal.mockReturnValue({ isModalOpen: false, openModal: vi.fn(), closeModal: vi.fn() });
        useEventPopup.mockReturnValue({
            popupEvent: { id: 8, title: 'Recurring', source: 'personal', tag: null, rrule: 'FREQ=WEEKLY' },
            popupAnchorRect: { top: 0, left: 0, width: 100, height: 30 },
            closePopup: vi.fn(),
            readOnly: false,
        });
        getEventType.mockReturnValue('personal');
        hasRecurrence.mockReturnValue(true);
        render(<EventPopups />);
        fireEvent.click(screen.getByText('Delete'));
        await waitFor(() => expect(executeDelete).toHaveBeenCalled());
    });

    it('recurring delete: choice ALTERNATE calls deleteRecurrenceOccurrence', async () => {
        mockConfirm.mockResolvedValueOnce('ALTERNATE');
        useEventModal.mockReturnValue({ isModalOpen: false, openModal: vi.fn(), closeModal: vi.fn() });
        useEventPopup.mockReturnValue({
            popupEvent: { id: 9, title: 'Rec', source: 'personal', tag: null, rrule: 'FREQ=DAILY' },
            popupAnchorRect: { top: 0, left: 0, width: 100, height: 30 },
            closePopup: vi.fn(),
            readOnly: false,
        });
        getEventType.mockReturnValue('personal');
        hasRecurrence.mockReturnValue(true);
        render(<EventPopups />);
        fireEvent.click(screen.getByText('Delete'));
        await waitFor(() => expect(deleteRecurrenceOccurrence).toHaveBeenCalled());
    });
});
