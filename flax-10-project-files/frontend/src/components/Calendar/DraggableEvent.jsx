import { useRef } from 'react';
import { useDrag } from '../../hooks/useDragDrop';
import { useEventActions } from '../../hooks/useCalendarEvents';
import { useEventModal } from '../../context/CalendarContext';
import { useEventResize } from '../../hooks/useEventResize';
import { formatTime } from '../../utils/dateUtils';
import { useTags } from '../../context/TagContext';
import './DraggableEvent.css';

export function DraggableEvent({ event, style, minWidthForDetails = 80 }) {
    const { editEvent } = useEventActions();
    const { openModal } = useEventModal();
    const { getTag } = useTags();
    const theme = getTag(event.tag);

    const eventRef = useRef(null);
    const resizeJustEnded = useRef(false);
    const { dragProps, isDragging } = useDrag({ type: 'EVENT', data: event });
    const { isResizing, resizePreview, handleResizeStart } = useEventResize(event, eventRef, editEvent, resizeJustEnded);
    const handleClick = () => {
        if (resizeJustEnded.current) { resizeJustEnded.current = false; return; }
        if (!isDragging && !isResizing) openModal(event);
    };

    return (
        <EventCard
            eventRef={eventRef} event={event} style={style} theme={theme}
            resizePreview={resizePreview} isDragging={isDragging} isResizing={isResizing}
            dragProps={dragProps} onClick={handleClick} onResizeStart={handleResizeStart}
            minWidth={minWidthForDetails} />
    );
}

function EventCard({ eventRef, event, style, theme, resizePreview, isDragging, isResizing, dragProps, onClick, onResizeStart, minWidth }) {
    const height = resizePreview || parseFloat(style?.height) || 0;
    const width = parseWidthPercent(style?.width);
    const className = buildClassName(isDragging, isResizing);
    const renderStyle = buildStyle(style, resizePreview, theme);
    return (
        <div ref={eventRef} className={className} style={renderStyle} onClick={onClick} {...dragProps}>
            <EventContent event={event} height={height} width={width} minWidth={minWidth} />
            <ResizeHandle onStart={onResizeStart} />
        </div>
    );
}

function parseWidthPercent(width) {
    if (!width) return 100;
    const match = width.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 100;
}

function ResizeHandle({ onStart }) {
    const onMouseDown = (e) => { e.stopPropagation(); e.preventDefault(); onStart(e); };
    return <div className="resize-handle" draggable={false} onMouseDown={onMouseDown} />;
}

function EventContent({ event, height, width, minWidth }) {
    const startTime = formatTime(new Date(event.start_time));
    const endTime = formatTime(new Date(event.end_time));
    const showTime = height >= 30 && width >= minWidth;
    const showDesc = height >= 60 && width >= minWidth;
    return (
        <div className="event-content">
            <div className="event-title">{event.title}</div>
            {showTime && <div className="event-time">{startTime} - {endTime}</div>}
            {showDesc && event.description && <div className="event-description">{event.description}</div>}
        </div>
    );
}

function buildStyle(baseStyle, resizePreview, theme) {
    const style = { ...baseStyle };
    if (resizePreview) style.height = `${resizePreview}px`;

    // Apply theme accent color to left border
    style.borderLeftColor = theme ? theme.color : '#8B7355';

    return style;
}

function buildClassName(isDragging, isResizing) {
    let className = 'draggable-event';
    if (isDragging) className += ' dragging';
    if (isResizing) className += ' resizing';
    return className;
}
