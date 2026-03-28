import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { DraggableEvent } from '../../../../components/calendar/DraggableEvent';
import * as useDragDrop from '../../../../components/calendar/hooks/useDragDrop';
import * as useEventResizeModule from '../../../../components/calendar/hooks/useEventResize';
import * as ConfirmContextModule from '../../../../context/ConfirmContext';
import * as CalendarContextModule from '../../../../context/CalendarContext';

// Hoisted mocks

const { mockOpenPopup, mockOpenModal, mockOpenDelete, mockConfirm } = vi.hoisted(() => ({
    mockOpenPopup: vi.fn(),
    mockOpenModal: vi.fn(),
    mockOpenDelete: vi.fn(),
    mockConfirm: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('../../../../components/calendar/hooks/useDragDrop', () => ({
    useDrag: vi.fn(() => ({ dragProps: {}, isDragging: false })),
}));

vi.mock('../../../../components/calendar/hooks/useCalendarEvents', () => ({
    useEventActions: vi.fn(() => ({
        editEvent: vi.fn(),
        removeEvent: vi.fn(),
        addException: vi.fn(),
    })),
}));

vi.mock('../../../../context/CalendarContext', () => ({
    useEventModal: vi.fn(() => ({ openModal: mockOpenModal })),
    useEventPopup: vi.fn(() => ({
        openPopup: mockOpenPopup,
        closePopup: vi.fn(),
        popupEvent: null,
        popupAnchorRect: null,
    })),
    useEventDelete: vi.fn(() => ({
        openDelete: mockOpenDelete,
        isDeleteOpen: false,
        deleteEvent: null,
        deleteType: null,
        closeDelete: vi.fn(),
    })),
}));

vi.mock('../../../../context/ConfirmContext', () => ({
    useConfirm: vi.fn(() => mockConfirm),
}));

vi.mock('../../../../components/calendar/hooks/useEventResize', () => ({
    useEventResize: vi.fn(() => ({
        handleResizeStart: vi.fn(),
        isResizing: false,
        resizePreview: null,
    })),
}));

vi.mock('../../../../components/calendar/utils/dateUtils', () => ({
    formatTime: vi.fn((d) => d.toTimeString().slice(0, 5)),
}));

vi.mock('../../../../components/calendar/utils/eventUtils', () => ({
    getEventType: vi.fn((event) => event.source || 'personal'),
    hasRecurrence: vi.fn(() => false),
}));

vi.mock('../../../../context/TagContext', () => ({
    useTags: vi.fn(() => ({
        tags: [],
        getTag: vi.fn(() => ({ color: '#000', label: 'None' })),
    })),
}));

<<<<<<< HEAD:flax-10-project-files/frontend/src/tests/components/calendar/DraggableEventStyles.test.jsx
const mockGetEventTheme = vi.fn(() => ({ color: '#3b82f6', background: '#dbeafe' }));
vi.mock('../../../components/calendar/utils/eventStyleUtils', () => ({
    getEventTheme: (...args) => mockGetEventTheme(...args),
=======
vi.mock('../../../../components/calendar/utils/eventStyleUtils', () => ({
    getEventTheme: vi.fn(() => ({ color: '#3b82f6', background: '#dbeafe' })),
>>>>>>> origin:flax-10-project-files/frontend/src/tests/components/calendar/draggable_event/DraggableEventStyles.test.jsx
}));

// CSS module mock
vi.mock('../../../../pages/tasks/components/TaskCardContextMenu.module.css', () => ({
    default: {
        ctxMenu: 'ctxMenu',
        ctxItem: 'ctxItem',
        ctxDivider: 'ctxDivider',
        ctxItemDanger: 'ctxItemDanger',
    },
}));

// Test fixtures

import { getEventType, hasRecurrence } from '../../../../components/calendar/utils/eventUtils';

const personalEvent = {
    id: 1,
    title: 'Team Meeting',
    start_time: '2025-01-15T10:00:00Z',
    end_time: '2025-01-15T11:00:00Z',
    source: 'personal',
    description: 'Weekly sync',
};

const societyEvent = {
    id: 2,
    title: 'Club Event',
    start_time: '2025-01-15T14:00:00Z',
    end_time: '2025-01-15T15:00:00Z',
    source: 'society',
    society_name: 'Chess Club',
};

const timetableEvent = {
    id: 3,
    title: 'Lecture',
    start_time: '2025-01-15T09:00:00Z',
    end_time: '2025-01-15T10:00:00Z',
    source: 'timetable',
};

const moduleEvent = {
    id: 4,
    title: 'CS Lecture',
    start_time: '2025-01-15T09:00:00Z',
    end_time: '2025-01-15T10:00:00Z',
    source: 'module',
};

// Tests

describe('DraggableEvent Styles Coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetEventTheme.mockImplementation(() => ({ color: '#3b82f6', background: '#dbeafe' }));
        getEventType.mockImplementation((event) => event.source || 'personal');
        hasRecurrence.mockReturnValue(false);
        vi.mocked(useEventResizeModule.useEventResize).mockReturnValue({
            handleResizeStart: vi.fn(),
            isResizing: false,
            resizePreview: null,
        });
        vi.mocked(useDragDrop.useDrag).mockReturnValue({ dragProps: {}, isDragging: false });
    });

    // parseWidth – different formats

    it('renders correctly with percentage width string', () => {
        render(<DraggableEvent event={personalEvent} style={{ height: '60px', width: '75%' }} />);
        expect(screen.getByText('Team Meeting')).toBeInTheDocument();
    });

    it('renders correctly with pixel width string', () => {
        render(<DraggableEvent event={personalEvent} style={{ height: '60px', width: '120px' }} />);
        expect(screen.getByText('Team Meeting')).toBeInTheDocument();
    });

    it('renders correctly when width is undefined (falls back to 100)', () => {
        render(<DraggableEvent event={personalEvent} style={{ height: '60px' }} />);
        expect(screen.getByText('Team Meeting')).toBeInTheDocument();
    });

    it('hides time details when width (as number) is below minWidth', () => {
        render(<DraggableEvent event={personalEvent} style={{ height: '60px', width: '10%' }} minWidthForDetails={80} />);
        expect(screen.queryByText(/\d{2}:\d{2}/)).toBeNull();
    });

    it('applies timetable-event class for module type', () => {
        getEventType.mockReturnValue('module');
        const { container } = render(<DraggableEvent event={moduleEvent} style={{ height: '60px', width: '100%' }} />);
        expect(container.querySelector('.timetable-event')).toBeInTheDocument();
    });

    it('applies timetable-event class for timetable type', () => {
        getEventType.mockReturnValue('timetable');
        const { container } = render(<DraggableEvent event={timetableEvent} style={{ height: '60px', width: '100%' }} />);
        expect(container.querySelector('.timetable-event')).toBeInTheDocument();
    });

    it('applies society-event class for society type', () => {
        getEventType.mockReturnValue('society');
        const { container } = render(<DraggableEvent event={societyEvent} style={{ height: '60px', width: '100%' }} />);
        expect(container.querySelector('.society-event')).toBeInTheDocument();
    });

    it('applies plain draggable-event class for unknown read-only type', () => {
        getEventType.mockReturnValue('other');
        const { container } = render(<DraggableEvent event={{ ...personalEvent, source: 'other' }} style={{ height: '60px', width: '100%' }} />);
        const el = container.querySelector('.draggable-event');
        expect(el.classList.contains('society-event')).toBe(false);
        expect(el.classList.contains('timetable-event')).toBe(false);
    });

    it('adds compact class to event-content when height < 28', () => {
        const { container } = render(<DraggableEvent event={personalEvent} style={{ height: '20px', width: '100%' }} />);
        expect(container.querySelector('.event-content.compact')).toBeInTheDocument();
        expect(container.querySelector('.event-title.compact')).toBeInTheDocument();
    });

    it('does NOT add compact class when height >= 28', () => {
        const { container } = render(<DraggableEvent event={personalEvent} style={{ height: '40px', width: '100%' }} />);
        expect(container.querySelector('.event-content.compact')).not.toBeInTheDocument();
    });

    it('uses resizePreview for event height when set', () => {
        vi.mocked(useEventResizeModule.useEventResize).mockReturnValue({ handleResizeStart: vi.fn(), isResizing: true, resizePreview: 120 });
        const { container } = render(<DraggableEvent event={personalEvent} style={{ height: '60px', width: '100%' }} />);
        expect(container.querySelector('.draggable-event').style.height).toBe('120px');
    });

    it('applies resizing class when isResizing is true', () => {
        vi.mocked(useEventResizeModule.useEventResize).mockReturnValue({ handleResizeStart: vi.fn(), isResizing: true, resizePreview: 80 });
        const { container } = render(<DraggableEvent event={personalEvent} style={{ height: '60px', width: '100%' }} />);
        expect(container.querySelector('.resizing')).toBeInTheDocument();
    });

    it('does NOT apply resizing class when isResizing is false', () => {
        const { container } = render(<DraggableEvent event={personalEvent} style={{ height: '60px', width: '100%' }} />);
        expect(container.querySelector('.resizing')).not.toBeInTheDocument();
    });

    it('shows society name when height >= 30 and width is sufficient', () => {
        getEventType.mockReturnValue('society');
        render(<DraggableEvent event={societyEvent} style={{ height: '60px', width: '100%' }} />);
        expect(screen.getByText('Chess Club')).toBeInTheDocument();
    });

    it('does not show society name when height < 30', () => {
        getEventType.mockReturnValue('society');
        render(<DraggableEvent event={societyEvent} style={{ height: '20px', width: '100%' }} />);
        expect(screen.queryByText('Chess Club')).not.toBeInTheDocument();
    });

    it('ReadOnlyEvent has no resize-handle even for personal events when readOnly', () => {
        const { container } = render(<DraggableEvent event={personalEvent} style={{ height: '60px', width: '100%' }} readOnly={true} />);
        expect(container.querySelector('.resize-handle')).toBeNull();
    });

    it('ReadOnlyEvent calls openPopup with readOnly=true', () => {
        getEventType.mockReturnValue('society');
        render(<DraggableEvent event={societyEvent} style={{ height: '60px', width: '100%' }} />);
        fireEvent.click(screen.getByText('Club Event').closest('[data-event-id]'));
        expect(mockOpenPopup).toHaveBeenCalledWith(societyEvent, expect.anything(), true);
    });

<<<<<<< HEAD:flax-10-project-files/frontend/src/tests/components/calendar/DraggableEventStyles.test.jsx
    it('treats non-numeric heights as zero for read-only cards', () => {
        getEventType.mockReturnValue('society');
        const { container } = render(<DraggableEvent event={societyEvent} style={{ height: 'auto', width: '100%' }} />);
        expect(container.querySelector('.event-content.compact')).toBeInTheDocument();
    });

    it('opens the event popup after a normal click', () => {
        render(<DraggableEvent event={personalEvent} style={{ height: '80px', width: '220px' }} />);
        fireEvent.click(screen.getByText('Team Meeting').closest('[data-event-id]'));
        expect(mockOpenPopup).toHaveBeenCalledWith(personalEvent, expect.anything());
    });

    // dragging class applied while isDragging

=======
>>>>>>> origin:flax-10-project-files/frontend/src/tests/components/calendar/draggable_event/DraggableEventStyles.test.jsx
    it('applies dragging class when isDragging is true', () => {
        vi.mocked(useDragDrop.useDrag).mockReturnValue({ dragProps: {}, isDragging: true });
        const { container } = render(<DraggableEvent event={personalEvent} style={{ height: '60px', width: '100%' }} />);
        expect(container.querySelector('.dragging')).toBeInTheDocument();
    });

    it('uses the default primary token when the theme omits a color', () => {
        mockGetEventTheme.mockReturnValueOnce({ background: '#fff' });
        const { container } = render(<DraggableEvent event={personalEvent} style={{ height: '60px', width: '100%' }} />);
        const el = container.querySelector('.draggable-event');
        expect(el.style.borderLeftColor).toBe('var(--color-primary)');
    });

    it('routes context menu actions and resize handles for personal events', async () => {
        const handleResizeStart = vi.fn();
        vi.mocked(useEventResizeModule.useEventResize).mockReturnValue({
            handleResizeStart,
            isResizing: false,
            resizePreview: null,
        });
        render(<DraggableEvent event={personalEvent} style={{ height: '80px', width: '220px' }} />);
        const card = screen.getByText('Team Meeting').closest('[data-event-id]');
        fireEvent.contextMenu(card, { clientX: 12, clientY: 14 });
        fireEvent.click(screen.getByRole('button', { name: /Edit/i }));
        expect(mockOpenModal).toHaveBeenCalledWith(personalEvent);
        fireEvent.contextMenu(card, { clientX: 12, clientY: 14 });
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Delete/i })); });
        expect(mockOpenDelete).toHaveBeenCalledWith(personalEvent);
        fireEvent.mouseDown(card.querySelector('.resize-handle'));
        expect(handleResizeStart).toHaveBeenCalled();
    });

    it('asks how to delete recurring events before opening delete', async () => {
        hasRecurrence.mockReturnValue(true);
        mockConfirm.mockResolvedValueOnce(true);
        render(<DraggableEvent event={personalEvent} style={{ height: '80px', width: '220px' }} />);
        const card = screen.getByText('Team Meeting').closest('[data-event-id]');
        fireEvent.contextMenu(card);
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Delete/i })); });
        expect(mockOpenDelete).toHaveBeenCalledWith(personalEvent, 'all');
        mockConfirm.mockResolvedValueOnce('ALTERNATE');
        fireEvent.contextMenu(card);
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Delete/i })); });
        expect(mockOpenDelete).toHaveBeenCalledWith(personalEvent, 'occurrence');
    });

    it('blocks popup opens during drag, resize, or immediately after resize', () => {
        vi.mocked(useDragDrop.useDrag).mockReturnValue({ dragProps: {}, isDragging: true });
        const { unmount } = render(<DraggableEvent event={personalEvent} style={{ height: '60px', width: '100%' }} />);
        fireEvent.click(screen.getByText('Team Meeting').closest('[data-event-id]'));
        expect(mockOpenPopup).not.toHaveBeenCalled();
        unmount();
        mockOpenPopup.mockClear();
        vi.mocked(useDragDrop.useDrag).mockReturnValue({ dragProps: {}, isDragging: false });
        vi.mocked(useEventResizeModule.useEventResize).mockReturnValue({
            handleResizeStart: vi.fn(),
            isResizing: true,
            resizePreview: 50,
        });
        render(<DraggableEvent event={personalEvent} style={{ height: '60px', width: '100%' }} />);
        fireEvent.click(screen.getByText('Team Meeting').closest('[data-event-id]'));
        expect(mockOpenPopup).not.toHaveBeenCalled();
    });

    it('suppresses the popup right after a resize gesture', () => {
        let resizeEndedRef;
        vi.mocked(useEventResizeModule.useEventResize).mockImplementation((_e, _ref, _edit, re) => {
            resizeEndedRef = re;
            return { handleResizeStart: vi.fn(), isResizing: false, resizePreview: null };
        });
        render(<DraggableEvent event={personalEvent} style={{ height: '60px', width: '100%' }} />);
        const card = screen.getByText('Team Meeting').closest('[data-event-id]');
        resizeEndedRef.current = true;
        fireEvent.click(card);
        expect(mockOpenPopup).not.toHaveBeenCalled();
    });

    it('closes the context menu after an outside mousedown', async () => {
        render(<DraggableEvent event={personalEvent} style={{ height: '80px', width: '220px' }} />);
        const card = screen.getByText('Team Meeting').closest('[data-event-id]');
        fireEvent.contextMenu(card);
        expect(screen.getByRole('button', { name: /Edit/i })).toBeInTheDocument();
        fireEvent.mouseDown(document.body);
        await waitFor(() => expect(screen.queryByRole('button', { name: /Edit/i })).not.toBeInTheDocument());
    });

    it('ignores recurring delete confirmations that are dismissed', async () => {
        hasRecurrence.mockReturnValue(true);
        mockConfirm.mockResolvedValueOnce(false);
        mockOpenDelete.mockClear();
        render(<DraggableEvent event={personalEvent} style={{ height: '80px', width: '220px' }} />);
        const card = screen.getByText('Team Meeting').closest('[data-event-id]');
        fireEvent.contextMenu(card);
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Delete/i })); });
        expect(mockOpenDelete).not.toHaveBeenCalled();
    });

    it('does not close the context menu when the press stays inside it', () => {
        render(<DraggableEvent event={personalEvent} style={{ height: '80px', width: '220px' }} />);
        const card = screen.getByText('Team Meeting').closest('[data-event-id]');
        fireEvent.contextMenu(card);
        const editBtn = screen.getByRole('button', { name: /Edit/i });
        fireEvent.mouseDown(editBtn);
        expect(editBtn).toBeInTheDocument();
    });

    it('uses zero height when neither resize preview nor style height parse', () => {
        vi.mocked(useEventResizeModule.useEventResize).mockReturnValue({
            handleResizeStart: vi.fn(),
            isResizing: false,
            resizePreview: null,
        });
        const { container } = render(<DraggableEvent event={personalEvent} style={{ height: 'auto', width: '100%' }} />);
        expect(container.querySelector('.event-content.compact')).toBeInTheDocument();
    });
});
