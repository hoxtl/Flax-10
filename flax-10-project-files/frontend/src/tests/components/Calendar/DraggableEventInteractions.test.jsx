import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { DraggableEvent } from '../../../components/Calendar/DraggableEvent';
import * as useDragDrop from '../../../components/Calendar/hooks/useDragDrop';
import * as useEventResizeModule from '../../../components/Calendar/hooks/useEventResize';
import * as ConfirmContextModule from '../../../context/ConfirmContext';
import * as CalendarContextModule from '../../../context/CalendarContext';

// Hoisted mocks

const { mockOpenPopup, mockOpenModal, mockOpenDelete, mockConfirm } = vi.hoisted(() => ({
    mockOpenPopup: vi.fn(),
    mockOpenModal: vi.fn(),
    mockOpenDelete: vi.fn(),
    mockConfirm: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('../../../components/Calendar/hooks/useDragDrop', () => ({
    useDrag: vi.fn(() => ({ dragProps: {}, isDragging: false })),
}));

vi.mock('../../../components/Calendar/hooks/useCalendarEvents', () => ({
    useEventActions: vi.fn(() => ({
        editEvent: vi.fn(),
        removeEvent: vi.fn(),
        addException: vi.fn(),
    })),
}));

vi.mock('../../../context/CalendarContext', () => ({
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

vi.mock('../../../context/ConfirmContext', () => ({
    useConfirm: vi.fn(() => mockConfirm),
}));

vi.mock('../../../components/Calendar/hooks/useEventResize', () => ({
    useEventResize: vi.fn(() => ({
        handleResizeStart: vi.fn(),
        isResizing: false,
        resizePreview: null,
    })),
}));

vi.mock('../../../components/Calendar/utils/dateUtils', () => ({
    formatTime: vi.fn((d) => d.toTimeString().slice(0, 5)),
}));

vi.mock('../../../components/Calendar/utils/eventUtils', () => ({
    getEventType: vi.fn((event) => event.source || 'personal'),
    hasRecurrence: vi.fn(() => false),
}));

vi.mock('../../../context/TagContext', () => ({
    useTags: vi.fn(() => ({
        tags: [],
        getTag: vi.fn(() => ({ color: '#000', label: 'None' })),
    })),
}));

vi.mock('../../../components/Calendar/utils/eventStyleUtils', () => ({
    getEventTheme: vi.fn(() => ({ color: '#3b82f6', background: '#dbeafe' })),
}));

// CSS module mock
vi.mock('../../../pages/Tasks/components/TaskCardContextMenu.module.css', () => ({
    default: {
        ctxMenu: 'ctxMenu',
        ctxItem: 'ctxItem',
        ctxDivider: 'ctxDivider',
        ctxItemDanger: 'ctxItemDanger',
    },
}));

// Test fixtures

import { getEventType, hasRecurrence } from '../../../components/Calendar/utils/eventUtils';

const personalEvent = {
    id: 1,
    title: 'Team Meeting',
    start_time: '2025-01-15T10:00:00Z',
    end_time: '2025-01-15T11:00:00Z',
    source: 'personal',
    description: 'Weekly sync',
};

const recurringEvent = {
    id: 5,
    title: 'Standup',
    start_time: '2025-01-15T09:00:00Z',
    end_time: '2025-01-15T09:30:00Z',
    source: 'personal',
    rrule: 'FREQ=DAILY',
};

// Tests

describe('DraggableEvent Interactions Coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getEventType.mockImplementation((event) => event.source || 'personal');
        hasRecurrence.mockReturnValue(false);
        vi.mocked(useEventResizeModule.useEventResize).mockReturnValue({
            handleResizeStart: vi.fn(),
            isResizing: false,
            resizePreview: null,
        });
        vi.mocked(useDragDrop.useDrag).mockReturnValue({ dragProps: {}, isDragging: false });
    });

    // Context menu rendering

    it('shows context menu with Edit and Delete buttons on right-click', () => {
        const { container } = render(<DraggableEvent event={personalEvent} style={{ height: '60px', width: '100%' }} />);
        fireEvent.contextMenu(container.querySelector('.draggable-event'), { clientX: 50, clientY: 80 });
        expect(screen.getByText('Edit')).toBeInTheDocument();
        expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('context menu is not rendered before right-click', () => {
        render(<DraggableEvent event={personalEvent} style={{ height: '60px', width: '100%' }} />);
        expect(screen.queryByText('Edit')).not.toBeInTheDocument();
        expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });

    it('clicking Edit in context menu calls openModal and closes menu', () => {
        const { container } = render(<DraggableEvent event={personalEvent} style={{ height: '60px', width: '100%' }} />);
        fireEvent.contextMenu(container.querySelector('.draggable-event'), { clientX: 50, clientY: 80 });
        fireEvent.click(screen.getByText('Edit'));
        expect(mockOpenModal).toHaveBeenCalledWith(personalEvent);
        expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });

    it('clicking Delete in context menu calls openDelete for non-recurring event', async () => {
        hasRecurrence.mockReturnValue(false);
        const { container } = render(<DraggableEvent event={personalEvent} style={{ height: '60px', width: '100%' }} />);
        fireEvent.contextMenu(container.querySelector('.draggable-event'), { clientX: 50, clientY: 80 });
        fireEvent.click(screen.getByText('Delete'));
        await waitFor(() => { expect(mockOpenDelete).toHaveBeenCalledWith(personalEvent); });
    });

    it('right-clicking positions context menu using CSS variables', () => {
        const { container } = render(<DraggableEvent event={personalEvent} style={{ height: '60px', width: '100%' }} />);
        fireEvent.contextMenu(container.querySelector('.draggable-event'), { clientX: 123, clientY: 456 });
        const menu = container.querySelector('.ctxMenu');
        expect(menu).toBeInTheDocument();
        expect(menu.style.getPropertyValue('--ctx-left')).toBe('123px');
        expect(menu.style.getPropertyValue('--ctx-top')).toBe('456px');
    });

    it('mousedown outside context menu closes it', () => {
        const { container } = render(<DraggableEvent event={personalEvent} style={{ height: '60px', width: '100%' }} />);
        fireEvent.contextMenu(container.querySelector('.draggable-event'));
        expect(screen.getByText('Edit')).toBeInTheDocument();
        fireEvent.mouseDown(document.body);
        expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });

    // Recurring event delete flow

    it('recurring delete with choice=true calls openDelete(event, "all")', async () => {
        hasRecurrence.mockReturnValue(true);
        mockConfirm.mockResolvedValueOnce(true);
        const { container } = render(<DraggableEvent event={recurringEvent} style={{ height: '60px', width: '100%' }} />);
        fireEvent.contextMenu(container.querySelector('.draggable-event'), { clientX: 50, clientY: 50 });
        fireEvent.click(screen.getByText('Delete'));
        await waitFor(() => { expect(mockOpenDelete).toHaveBeenCalledWith(recurringEvent, 'all'); });
    });

    it('recurring delete with choice="ALTERNATE" calls openDelete(event, "occurrence")', async () => {
        hasRecurrence.mockReturnValue(true);
        mockConfirm.mockResolvedValueOnce('ALTERNATE');
        const { container } = render(<DraggableEvent event={recurringEvent} style={{ height: '60px', width: '100%' }} />);
        fireEvent.contextMenu(container.querySelector('.draggable-event'), { clientX: 50, clientY: 50 });
        fireEvent.click(screen.getByText('Delete'));
        await waitFor(() => { expect(mockOpenDelete).toHaveBeenCalledWith(recurringEvent, 'occurrence'); });
    });

    it('recurring delete with cancelled confirm (null) does not call openDelete', async () => {
        hasRecurrence.mockReturnValue(true);
        mockConfirm.mockResolvedValueOnce(null);
        const { container } = render(<DraggableEvent event={recurringEvent} style={{ height: '60px', width: '100%' }} />);
        fireEvent.contextMenu(container.querySelector('.draggable-event'), { clientX: 50, clientY: 50 });
        fireEvent.click(screen.getByText('Delete'));
        await waitFor(() => { expect(mockConfirm).toHaveBeenCalled(); });
        expect(mockOpenDelete).not.toHaveBeenCalled();
    });

    // resizeEnded.current logic – click is swallowed after resize

    it('click after resize is swallowed (resizeEnded flag prevents openPopup)', () => {
        let capturedResizeEnded;
        vi.mocked(useEventResizeModule.useEventResize).mockImplementation((_event, _ref, _editEvent, resizeEnded) => {
            capturedResizeEnded = resizeEnded;
            return { handleResizeStart: vi.fn(), isResizing: false, resizePreview: null };
        });
        const { container } = render(<DraggableEvent event={personalEvent} style={{ height: '60px', width: '100%' }} />);
        if (capturedResizeEnded) capturedResizeEnded.current = true;
        fireEvent.click(container.querySelector('.draggable-event'));
        expect(mockOpenPopup).not.toHaveBeenCalled();
    });

    // Resize handle fires handleResizeStart

    it('mousedown on resize handle calls handleResizeStart', () => {
        const mockHandleResizeStart = vi.fn();
        vi.mocked(useEventResizeModule.useEventResize).mockReturnValue({
            handleResizeStart: mockHandleResizeStart,
            isResizing: false,
            resizePreview: null,
        });
        const { container } = render(<DraggableEvent event={personalEvent} style={{ height: '60px', width: '100%' }} />);
        fireEvent.mouseDown(container.querySelector('.resize-handle'));
        expect(mockHandleResizeStart).toHaveBeenCalled();
    });
});
