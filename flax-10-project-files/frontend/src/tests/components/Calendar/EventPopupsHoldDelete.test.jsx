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

import { EventPopups } from '../../../components/Calendar/EventPopups';
import { useEventModal, useEventPopup, useEventDelete } from '../../../context/CalendarContext';
import { executeDelete, deleteRecurrenceOccurrence } from '../../../components/Calendar/utils/formUtils';

function setupModalClosed() {
    useEventModal.mockReturnValue({
        isModalOpen: false,
        closeModal: vi.fn(),
        openModal: vi.fn(),
    });
}

describe('EventPopups HoldDelete Coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockConfirm.mockResolvedValue(true);
        useEventDelete.mockReturnValue({
            openDelete: mockOpenDelete,
            isDeleteOpen: false,
            deleteEvent: null,
            deleteType: null,
            closeDelete: mockCloseDelete,
        });
    });

    it('renders HoldConfirmModal with "Delete ALL occurrences?" warning when type is all', () => {
        const evt = { id: 1, title: 'Standup' };
        useEventDelete.mockReturnValue({ openDelete: mockOpenDelete, isDeleteOpen: true, deleteEvent: evt, deleteType: 'all', closeDelete: mockCloseDelete });
        setupModalClosed();
        useEventPopup.mockReturnValue({ popupEvent: null, closePopup: vi.fn(), readOnly: false });
        render(<EventPopups />);
        expect(screen.getByTestId('hold-confirm-modal')).toBeInTheDocument();
        expect(screen.getByTestId('hold-warning').textContent).toBe('Delete ALL occurrences?');
    });

    it('renders HoldConfirmModal with "Confirm deletion." warning when type is occurrence', () => {
        const evt = { id: 2, title: 'Lecture' };
        useEventDelete.mockReturnValue({ openDelete: mockOpenDelete, isDeleteOpen: true, deleteEvent: evt, deleteType: 'occurrence', closeDelete: mockCloseDelete });
        setupModalClosed();
        useEventPopup.mockReturnValue({ popupEvent: null, closePopup: vi.fn(), readOnly: false });
        render(<EventPopups />);
        expect(screen.getByTestId('hold-warning').textContent).toBe('Confirm deletion.');
    });

    it('renders HoldConfirmModal with "Confirm deletion." for plain (non-recurring) delete', () => {
        const evt = { id: 3, title: 'Meeting' };
        useEventDelete.mockReturnValue({ openDelete: mockOpenDelete, isDeleteOpen: true, deleteEvent: evt, deleteType: null, closeDelete: mockCloseDelete });
        setupModalClosed();
        useEventPopup.mockReturnValue({ popupEvent: null, closePopup: vi.fn(), readOnly: false });
        render(<EventPopups />);
        expect(screen.getByTestId('hold-warning').textContent).toBe('Confirm deletion.');
    });

    it('onConfirm calls deleteRecurrenceOccurrence when type is occurrence', async () => {
        const evt = { id: 4, title: 'Daily Task' };
        useEventDelete.mockReturnValue({ openDelete: mockOpenDelete, isDeleteOpen: true, deleteEvent: evt, deleteType: 'occurrence', closeDelete: mockCloseDelete });
        setupModalClosed();
        useEventPopup.mockReturnValue({ popupEvent: null, closePopup: vi.fn(), readOnly: false });
        render(<EventPopups />);
        fireEvent.click(screen.getByText('Confirm Hold'));
        await waitFor(() => {
            expect(deleteRecurrenceOccurrence).toHaveBeenCalledWith(evt, expect.objectContaining({ removeEvent: mockRemoveEvent, addException: mockAddException }));
            expect(mockCloseDelete).toHaveBeenCalled();
            expect(mockToast).toHaveBeenCalledWith(`"${evt.title}" deleted.`);
        });
    });

    it('onConfirm calls executeDelete when type is all', async () => {
        const evt = { id: 5, title: 'Weekly Meeting' };
        useEventDelete.mockReturnValue({ openDelete: mockOpenDelete, isDeleteOpen: true, deleteEvent: evt, deleteType: 'all', closeDelete: mockCloseDelete });
        setupModalClosed();
        useEventPopup.mockReturnValue({ popupEvent: null, closePopup: vi.fn(), readOnly: false });
        render(<EventPopups />);
        fireEvent.click(screen.getByText('Confirm Hold'));
        await waitFor(() => {
            expect(executeDelete).toHaveBeenCalledWith(evt, expect.objectContaining({ removeEvent: mockRemoveEvent }));
            expect(mockCloseDelete).toHaveBeenCalled();
            expect(mockToast).toHaveBeenCalledWith(`"${evt.title}" deleted.`);
        });
    });

    it('onCancel calls closeDelete', () => {
        const evt = { id: 6, title: 'Task' };
        useEventDelete.mockReturnValue({ openDelete: mockOpenDelete, isDeleteOpen: true, deleteEvent: evt, deleteType: null, closeDelete: mockCloseDelete });
        setupModalClosed();
        useEventPopup.mockReturnValue({ popupEvent: null, closePopup: vi.fn(), readOnly: false });
        render(<EventPopups />);
        fireEvent.click(screen.getByText('Cancel Hold'));
        expect(mockCloseDelete).toHaveBeenCalled();
    });

    it('does not render HoldConfirmModal when isDeleteOpen is false', () => {
        setupModalClosed();
        useEventPopup.mockReturnValue({ popupEvent: null, closePopup: vi.fn(), readOnly: false });
        render(<EventPopups />);
        expect(screen.queryByTestId('hold-confirm-modal')).not.toBeInTheDocument();
    });

    it('HoldConfirmModal title contains event title', () => {
        const evt = { id: 19, title: 'Important Task' };
        useEventDelete.mockReturnValue({ openDelete: mockOpenDelete, isDeleteOpen: true, deleteEvent: evt, deleteType: null, closeDelete: mockCloseDelete });
        setupModalClosed();
        useEventPopup.mockReturnValue({ popupEvent: null, closePopup: vi.fn(), readOnly: false });
        render(<EventPopups />);
        expect(screen.getByTestId('hold-title').textContent).toBe('Delete "Important Task"');
    });
});
