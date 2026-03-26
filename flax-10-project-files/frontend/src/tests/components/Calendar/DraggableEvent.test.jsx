import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DraggableEvent } from '../../../components/calendar/DraggableEvent';
import * as useDragDrop from '../../../components/calendar/hooks/useDragDrop';
import * as useEventResize from '../../../components/calendar/hooks/useEventResize';

vi.mock('../../../components/calendar/hooks/useDragDrop', () => ({
    useDrag: vi.fn(() => ({ dragProps: {}, isDragging: false })),
}));

vi.mock('../../../components/calendar/hooks/useCalendarEvents', () => ({
    useEventActions: vi.fn(() => ({ editEvent: vi.fn(), removeEvent: vi.fn(), addException: vi.fn() })),
}));

vi.mock('../../../context/CalendarContext', () => ({
    useEventModal: vi.fn(() => ({ openModal: vi.fn() })),
    useEventPopup: vi.fn(() => ({ openPopup: mockOpenPopup, closePopup: vi.fn(), popupEvent: null, popupAnchorRect: null })),
    useEventDelete: vi.fn(() => ({ openDelete: vi.fn(), isDeleteOpen: false, deleteEvent: null, deleteType: null, closeDelete: vi.fn() })),
}));

vi.mock('../../../context/ConfirmContext', () => ({
    useConfirm: vi.fn(() => vi.fn()),
}));

const { mockOpenPopup } = vi.hoisted(() => ({ mockOpenPopup: vi.fn() }));
vi.mock('../../../components/calendar/hooks/useEventResize', () => ({
    useEventResize: vi.fn(() => ({
        handleResizeStart: vi.fn(),
        isResizing: false,
        resizePreview: null,
    })),
}));

vi.mock('../../../components/calendar/utils/dateUtils', () => ({
    formatTime: vi.fn((d) => d.toTimeString().slice(0, 5)),
}));

vi.mock('../../../components/calendar/utils/eventUtils', () => ({
    getEventType: vi.fn((event) => event.source || 'personal'),
}));

vi.mock('../../../context/TagContext', () => ({
    useTags: vi.fn(() => ({ tags: [], getTag: vi.fn(() => ({ color: '#000', label: 'None' })) })),
}));

vi.mock('../../../components/calendar/utils/eventStyleUtils', () => ({
    getEventTheme: vi.fn(() => ({ color: '#3b82f6', background: '#dbeafe' })),
}));

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

import { getEventType } from '../../../components/calendar/utils/eventUtils';

describe('DraggableEvent', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getEventType.mockImplementation((event) => event.source || 'personal');
    });

    it('renders event title', () => {
        render(<DraggableEvent event={personalEvent} style={{ height: '60px', width: '100%' }} />);
        expect(screen.getByText('Team Meeting')).toBeTruthy();
    });

    it('renders ReadOnlyEvent for non-personal events', () => {
        getEventType.mockReturnValue('society');
        render(<DraggableEvent event={societyEvent} style={{ height: '60px', width: '100%' }} />);
        expect(screen.getByText('Club Event')).toBeTruthy();
    });

    it('renders ReadOnlyEvent when readOnly is true', () => {
        render(<DraggableEvent event={personalEvent} style={{ height: '60px', width: '100%' }} readOnly={true} />);
        expect(screen.getByText('Team Meeting')).toBeTruthy();
    });

    it('renders resize handle for editable personal event', () => {
        const { container } = render(<DraggableEvent event={personalEvent} style={{ height: '60px', width: '100%' }} />);
        expect(container.querySelector('.resize-handle')).toBeTruthy();
    });

    it('does not render resize handle for read-only events', () => {
        getEventType.mockReturnValue('society');
        const { container } = render(<DraggableEvent event={societyEvent} style={{ height: '60px', width: '100%' }} />);
        expect(container.querySelector('.resize-handle')).toBeNull();
    });

    it('shows time when height >= 30 and width is sufficient', () => {
        render(<DraggableEvent event={personalEvent} style={{ height: '60px', width: '100%' }} />);
        expect(screen.getByText(/:/)).toBeTruthy();
    });

    it('does not show time when height < 30', () => {
        render(<DraggableEvent event={personalEvent} style={{ height: '20px', width: '100%' }} />);
        expect(screen.queryByText(/\d{2}:\d{2}/)).toBeNull();
    });

    it('shows description when height >= 60', () => {
        render(<DraggableEvent event={personalEvent} style={{ height: '80px', width: '100%' }} />);
        expect(screen.getByText('Weekly sync')).toBeTruthy();
    });

    it('does not show description when height < 60', () => {
        render(<DraggableEvent event={personalEvent} style={{ height: '40px', width: '100%' }} />);
        expect(screen.queryByText('Weekly sync')).toBeNull();
    });

    it('calls openPopup when read-only event is clicked', () => {
        getEventType.mockReturnValue('society');
        render(<DraggableEvent event={societyEvent} style={{ height: '60px', width: '100%' }} />);
        const eventEl = screen.getByText('Club Event').closest('[data-event-id]');
        fireEvent.click(eventEl);
        expect(mockOpenPopup).toHaveBeenCalledWith(societyEvent, expect.anything(), true);
    });

    it('shows society name for society events', () => {
        getEventType.mockReturnValue('society');
        render(<DraggableEvent event={societyEvent} style={{ height: '60px', width: '100%' }} />);
        expect(screen.getByText('Chess Club')).toBeTruthy();
    });

    it('applies society-event class for society events', () => {
        getEventType.mockReturnValue('society');
        const { container } = render(<DraggableEvent event={societyEvent} style={{ height: '60px', width: '100%' }} />);
        expect(container.querySelector('.society-event')).toBeTruthy();
    });

    it('applies timetable-event class for timetable events', () => {
        getEventType.mockReturnValue('timetable');
        const { container } = render(<DraggableEvent event={timetableEvent} style={{ height: '60px', width: '100%' }} />);
        expect(container.querySelector('.timetable-event')).toBeTruthy();
    });

    it('applies module-event class for module events', () => {
        getEventType.mockReturnValue('module');
        const { container } = render(<DraggableEvent event={{ ...timetableEvent, source: 'module' } } style={{ height: '60px', width: '100%' }} />);
        expect(container.querySelector('.timetable-event')).toBeTruthy();
    });

    it('does not call openPopup when isDragging', () => {
        vi.mocked(useDragDrop.useDrag).mockReturnValue({ dragProps: {}, isDragging: true });
        render(<DraggableEvent event={personalEvent} style={{ height: '60px', width: '100%' }} />);
        const eventEl = screen.getByText('Team Meeting').closest('.draggable-event');
        fireEvent.click(eventEl);
        expect(mockOpenPopup).not.toHaveBeenCalled();
    });

    it('does not call openPopup when isResizing', () => {
        vi.mocked(useEventResize.useEventResize).mockReturnValue({
            handleResizeStart: vi.fn(),
            isResizing: true,
            resizePreview: null,
        });
        render(<DraggableEvent event={personalEvent} style={{ height: '60px', width: '100%' }} />);
        const eventEl = screen.getByText('Team Meeting').closest('.draggable-event');
        fireEvent.click(eventEl);
        expect(mockOpenPopup).not.toHaveBeenCalled();
    });

});
