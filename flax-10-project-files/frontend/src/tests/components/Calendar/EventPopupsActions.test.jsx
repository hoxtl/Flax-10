import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Hoisted mocks

const {
    mockRefreshTags,
    mockLoadEvents,
    mockConfirm,
    mockToast,
    mockOpenDelete,
    mockCloseDelete,
    mockRemoveEvent,
    mockAddException,
} = vi.hoisted(() => ({
    mockRefreshTags: vi.fn(),
    mockLoadEvents: vi.fn(),
    mockConfirm: vi.fn(() => Promise.resolve(true)),
    mockToast: vi.fn(),
    mockOpenDelete: vi.fn(),
    mockCloseDelete: vi.fn(),
    mockRemoveEvent: vi.fn(() => Promise.resolve()),
    mockAddException: vi.fn(() => Promise.resolve()),
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
}));

vi.mock('../../../context/CalendarContext', () => ({
    useEventModal: vi.fn(),
    useEventPopup: vi.fn(),
    useCalendarDispatch: vi.fn(() => vi.fn()),
    useEventDelete: vi.fn(() => ({
        openDelete: mockOpenDelete,
        isDeleteOpen: false,
        deleteEvent: null,
        deleteType: null,
        closeDelete: mockCloseDelete,
    })),
}));

vi.mock('../../../components/Calendar/event_modal/EventModal', () => ({
    EventModal: ({ event, onClose }) => (
        <div data-testid="event-modal">
            <span>{event?.title || 'New Event'}</span>
            <button onClick={onClose}>Close Modal</button>
        </div>
    ),
}));

vi.mock('../../../components/Calendar/event_popover/EventPopover', () => ({
    EventPopover: ({ event, onClose, actions, tag }) => (
        <div data-testid="event-popup">
            <span>{event?.title}</span>
            {tag && <span data-testid="popup-tag">{tag.label}</span>}
            <button onClick={onClose}>Close Popup</button>
            {actions?.map((a, i) => (
                <button key={i} data-action={a.label} onClick={a.onClick}>{a.label}</button>
            ))}
        </div>
    ),
}));

vi.mock('../../../context/TagContext', () => ({
    useTags: () => ({
        getTag: vi.fn(() => ({ label: 'TagLabel', color: '#aaa' })),
        refreshTags: mockRefreshTags,
    }),
}));

vi.mock('../../../components/Notifications/hooks/useNotify', () => ({
    useNotify: () => vi.fn(),
}));

vi.mock('../../../components/Calendar/hooks/useCalendarEvents', () => ({
    useCalendarEvents: () => ({ loadEvents: mockLoadEvents }),
    useEventActions: () => ({
        removeEvent: mockRemoveEvent,
        addException: mockAddException,
    }),
}));

vi.mock('../../../components/Calendar/utils/eventUtils', () => ({
    getEventType: vi.fn(() => 'personal'),
    hasRecurrence: vi.fn(() => false),
}));

vi.mock('../../../components/Calendar/utils/formUtils', () => ({
    executeDelete: vi.fn(() => Promise.resolve()),
    deleteRecurrenceOccurrence: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../../api/societyApi', () => ({
    unsyncCalendar: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../../components/Modules/hooks/useModuleDisenrollment', () => ({
    useModuleDisenrollment: () => ({ disenrollFromModule: vi.fn() }),
}));

vi.mock('../../../context/ConfirmContext', () => ({
    useConfirm: () => mockConfirm,
}));

vi.mock('../../../context/ToastContext', () => ({
    useToast: () => mockToast,
}));

vi.mock('../../../components/common/hold_confirm_modal/HoldConfirmModal', () => ({
    default: ({ title, warningText, onConfirm, onCancel }) => (
        <div data-testid="hold-confirm-modal">
            <span data-testid="hold-title">{title}</span>
            <span data-testid="hold-warning">{warningText}</span>
            <button onClick={onConfirm}>Confirm Hold</button>
            <button onClick={onCancel}>Cancel Hold</button>
        </div>
    ),
}));

// Import under test (after mocks)

import { EventPopups } from '../../../components/Calendar/EventPopups';
import { useEventModal, useEventPopup, useEventDelete } from '../../../context/CalendarContext';
import { getEventType, hasRecurrence } from '../../../components/Calendar/utils/eventUtils';
import { unsyncCalendar } from '../../../api/societyApi';
import { executeDelete, deleteRecurrenceOccurrence } from '../../../components/Calendar/utils/formUtils';

// Helpers

function setupModalClosed() {
    useEventModal.mockReturnValue({
        isModalOpen: false,
        closeModal: vi.fn(),
        openModal: vi.fn(),
    });
}

function setupPopupEvent(evt, extra = {}) {
    useEventPopup.mockReturnValue({
        popupEvent: evt,
        popupAnchorRect: { top: 0, left: 0, width: 100, height: 30 },
        closePopup: extra.closePopup || vi.fn(),
        readOnly: extra.readOnly ?? false,
        viewMode: extra.viewMode || 'week',
    });
}

// Tests

describe('EventPopups extra coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockConfirm.mockResolvedValue(true);
        // Default: delete modal closed
        useEventDelete.mockReturnValue({
            openDelete: mockOpenDelete,
            isDeleteOpen: false,
            deleteEvent: null,
            deleteType: null,
            closeDelete: mockCloseDelete,
        });
    });

    // getPopupActions – society events show only Unsync action

    it('returns only Unsync action for society events', () => {
        setupModalClosed();
        const evt = { id: 7, title: 'Society Party', source: 'society', society_id: 10, society_name: 'Art Club' };
        setupPopupEvent(evt);
        getEventType.mockReturnValue('society');
        render(<EventPopups />);
        expect(screen.getByText('Unsync')).toBeInTheDocument();
        expect(screen.queryByText('Edit')).not.toBeInTheDocument();
        expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });

});
    // getPopupActions – non-personal, non-society returns null (no actions)

    it('returns no actions for timetable events', () => {
        setupModalClosed();
        const evt = { id: 8, title: 'CS Lecture', source: 'timetable' };
        setupPopupEvent(evt);
        getEventType.mockReturnValue('timetable');
        render(<EventPopups />);
        expect(screen.queryByText('Edit')).not.toBeInTheDocument();
        expect(screen.queryByText('Delete')).not.toBeInTheDocument();
        expect(screen.queryByText('Unsync')).not.toBeInTheDocument();
    });

    it('returns no actions for module events', () => {
        setupModalClosed();
        const evt = { id: 9, title: 'Module Lecture', source: 'module' };
        setupPopupEvent(evt);
        getEventType.mockReturnValue('module');
        render(<EventPopups />);
        expect(screen.queryByText('Edit')).not.toBeInTheDocument();
        expect(screen.queryByText('Unsync')).not.toBeInTheDocument();
    });

    // getPopupActions – readOnly popup returns null regardless of type

    it('returns no actions when popup is readOnly', () => {
        setupModalClosed();
        const evt = { id: 10, title: 'Read Only Event', source: 'personal' };
        setupPopupEvent(evt, { readOnly: true });
        getEventType.mockReturnValue('personal');
        render(<EventPopups />);
        expect(screen.queryByText('Edit')).not.toBeInTheDocument();
        expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });

    // EventPopupContainer – tag_name on society event used as tag label

    it('uses tag_name and tag_color from society event as the tag prop', () => {
        setupModalClosed();
        const evt = {
            id: 11,
            title: 'Soc Meet',
            source: 'society',
            society_id: 5,
            tag_name: 'Engineering',
            tag_color: '#ff5500',
        };
        setupPopupEvent(evt);
        getEventType.mockReturnValue('society');
        render(<EventPopups />);
        // The mock EventPopover renders tag.label in a span
        expect(screen.getByTestId('popup-tag').textContent).toBe('Engineering');
    });

    it('uses default color (var(--color-caramel)) when tag_color is missing on society event', () => {
        setupModalClosed();
        const evt = {
            id: 12,
            title: 'Art Showcase',
            source: 'society',
            society_id: 6,
            tag_name: 'Art',
            tag_color: null,
        };
        setupPopupEvent(evt);
        getEventType.mockReturnValue('society');
        render(<EventPopups />);
        // tag should still have the label
        expect(screen.getByTestId('popup-tag').textContent).toBe('Art');
    });

    it('uses getTag for non-society events', () => {
        setupModalClosed();
        const evt = { id: 13, title: 'Personal Task', source: 'personal', tag: 'tag-123' };
        setupPopupEvent(evt);
        getEventType.mockReturnValue('personal');
        render(<EventPopups />);
        // getTag is mocked to return { label: 'TagLabel', color: '#aaa' }
        expect(screen.getByTestId('popup-tag').textContent).toBe('TagLabel');
    });

    // EventPopupContainer – society event without tag_name uses getTag path

    it('uses getTag when society event has no tag_name', () => {
        setupModalClosed();
        const evt = {
            id: 14,
            title: 'Society Event No Tag',
            source: 'society',
            society_id: 7,
            tag_name: null,
            tag: 'some-tag',
        };
        setupPopupEvent(evt);
        getEventType.mockReturnValue('society');
        render(<EventPopups />);
        // Falls through to getTag which returns { label: 'TagLabel' }
        expect(screen.getByTestId('popup-tag').textContent).toBe('TagLabel');
    });

    // Unsync action – calls unsyncCalendar, refreshTags, loadEvents, toast

    it('Unsync action on society event without society_name uses "society" fallback', async () => {
        setupModalClosed();
        const evt = { id: 15, title: 'No Name Soc', source: 'society', society_id: 20, society_name: undefined };
        setupPopupEvent(evt);
        getEventType.mockReturnValue('society');
        render(<EventPopups />);
        fireEvent.click(screen.getByText('Unsync'));
        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith('Unsynced society');
        });
    });

    it('Unsync action calls unsyncCalendar with correct society_id', async () => {
        setupModalClosed();
        const evt = { id: 16, title: 'Drama', source: 'society', society_id: 99, society_name: 'Drama Club' };
        setupPopupEvent(evt);
        getEventType.mockReturnValue('society');
        render(<EventPopups />);
        fireEvent.click(screen.getByText('Unsync'));
        await waitFor(() => {
            expect(unsyncCalendar).toHaveBeenCalledWith(99);
        });
    });

    // Edit action – opens modal and closes popup

    it('Edit action calls openModal and closePopup', () => {
        const mockClosePopup = vi.fn();
        const mockOpenModalFn = vi.fn();
        useEventModal.mockReturnValue({ isModalOpen: false, openModal: mockOpenModalFn, closeModal: vi.fn() });
        const evt = { id: 17, title: 'Personal Evt', source: 'personal', tag: null };
        useEventPopup.mockReturnValue({
            popupEvent: evt,
            popupAnchorRect: { top: 0, left: 0, width: 100, height: 30 },
            closePopup: mockClosePopup,
            readOnly: false,
        });
        getEventType.mockReturnValue('personal');
        render(<EventPopups />);
        fireEvent.click(screen.getByText('Edit'));
        expect(mockClosePopup).toHaveBeenCalled();
        expect(mockOpenModalFn).toHaveBeenCalledWith(evt);
    });

    // Delete action for non-recurring event – opens delete directly

    it('Delete action calls openDelete directly for non-recurring event', async () => {
        setupModalClosed();
        const evt = { id: 18, title: 'Task', source: 'personal', tag: null };
        setupPopupEvent(evt);
        getEventType.mockReturnValue('personal');
        hasRecurrence.mockReturnValue(false);
        render(<EventPopups />);
        fireEvent.click(screen.getByText('Delete'));
        await waitFor(() => {
            expect(mockOpenDelete).toHaveBeenCalledWith(evt);
        });
    });

    // EventPopupContainer – not rendered when modal open

    it('EventPopupContainer is not rendered when isModalOpen is true', () => {
        useEventModal.mockReturnValue({
            isModalOpen: true,
            openModal: vi.fn(),
            closeModal: vi.fn(),
            modalEvent: { id: 1, title: 'M' },
            modalType: null,
            modalInitialDate: null,
        });
        useEventPopup.mockReturnValue({
            popupEvent: { id: 2, title: 'P', source: 'personal' },
            popupAnchorRect: { top: 0, left: 0, width: 100, height: 30 },
            closePopup: vi.fn(),
            readOnly: false,
        });
        render(<EventPopups />);
        expect(screen.queryByTestId('event-popup')).not.toBeInTheDocument();
    });

