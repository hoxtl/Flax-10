import { useRef } from 'react';
import { useDrag } from '../../hooks/useDragDrop';
import { useEventActions } from '../../hooks/useCalendarEvents';
import { useEventModal } from '../../context/CalendarContext';
import { useEventResize } from '../../hooks/useEventResize';
import { formatTime } from '../../utils/dateUtils';
import { getCardTheme } from '../../utils/cardUtils';
import './DraggableEvent.css';

export function DraggableEvent({ event, style }) {
    const { editEvent } = useEventActions();
    const { openModal } = useEventModal();
    const eventRef = useRef(null);
    const resizeJustEnded = useRef(false);
    const { dragProps, isDragging } = useDrag({ type: 'EVENT', data: event });
    const { isResizing, resizePreview, handleResizeStart } = useEventResize(event, eventRef, editEvent, resizeJustEnded);
    const handleClick = createClickHandler(resizeJustEnded, isDragging, isResizing, openModal, event);
    return (
        <EventCard
            eventRef={eventRef} event={event} style={style}
            resizePreview={resizePreview} isDragging={isDragging} isResizing={isResizing}
            dragProps={dragProps} onClick={handleClick} onResizeStart={handleResizeStart}
        />
    );
}

function createClickHandler(resizeJustEnded, isDragging, isResizing, openModal, event) {
    return () => {
        if (resizeJustEnded.current) {
            resizeJustEnded.current = false;
            return;
        }
        if (!isDragging && !isResizing) openModal(event);
    };
}

function EventCard({ eventRef, event, style, resizePreview, isDragging, isResizing, dragProps, onClick, onResizeStart }) {
    const handleResizeMouseDown = (e) => {
        e.stopPropagation();
        e.preventDefault();
        onResizeStart(e);
    };
    const height = resizePreview || parseFloat(style?.height) || 0;
    return (
        <div
            ref={eventRef}
            className={buildClassName(isDragging, isResizing)}
            style={buildStyle(style, resizePreview, event)}
            onClick={onClick}
            {...dragProps}
        >
            <EventContent event={event} height={height} />
            <div className="resize-handle" draggable={false} onMouseDown={handleResizeMouseDown} />
        </div>
    );
}

function EventContent({ event, height }) {
    const startTime = formatTime(new Date(event.start_time));
    const endTime = formatTime(new Date(event.end_time));
    const showTime = height >= 30;
    const showDescription = height >= 60 && event.description;
    return (
        <div className="event-content">
            <div className="event-title">{event.title}</div>
            {showTime && <div className="event-time">{startTime} - {endTime}</div>}
            {showDescription && <div className="event-description">{event.description}</div>}
        </div>
    );
}

function buildStyle(baseStyle, resizePreview, event) {
    const style = { ...baseStyle };
    if (resizePreview) style.height = `${resizePreview}px`;

    // Apply theme accent color to left border
    const theme = getCardTheme(event.tag_name);
    style.borderLeftColor = theme.accent;

    return style;
}

function buildClassName(isDragging, isResizing) {
    let className = 'draggable-event';
    if (isDragging) className += ' dragging';
    if (isResizing) className += ' resizing';
    return className;
}
