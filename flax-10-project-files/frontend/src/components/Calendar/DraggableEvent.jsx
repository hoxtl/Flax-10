import { useRef } from 'react';
import { useDrag } from '../../hooks/useDragDrop';
import { useEventActions } from '../../hooks/useCalendarEvents';
import { useEventModal } from '../../context/CalendarContext';
import { useEventResize } from '../../hooks/useEventResize';
import { formatTime } from '../../utils/dateUtils';
import { useTags } from '../../context/TagContext';
import './DraggableEvent.css';

export function DraggableEvent({ event, style, minWidthForDetails = 80 }) {
    const { openModal } = useEventModal();
    const theme = useTags().getTag(event.tag);
    const refs = useEventRefs();
    const { dragProps, isDragging } = useDrag({ type: 'EVENT', data: event });
    const resize = useEventResize(event, refs.event, useEventActions().editEvent, refs.resizeEnded);
    const onClick = createClickHandler(refs.resizeEnded, isDragging, resize.isResizing, openModal, event);

    return (
        <EventCard event={event} style={style} theme={theme} refs={refs}
            resize={resize} isDragging={isDragging} dragProps={dragProps}
            onClick={onClick} minWidth={minWidthForDetails} />
    );
}

function useEventRefs() {
    return { event: useRef(null), resizeEnded: useRef(false) };
}

function createClickHandler(resizeEndedRef, isDragging, isResizing, openModal, event) {
    return () => {
        if (resizeEndedRef.current) { resizeEndedRef.current = false; return; }
        if (!isDragging && !isResizing) openModal(event);
    };
}

function EventCard({ event, style, theme, refs, resize, isDragging, dragProps, onClick, minWidth }) {
    const height = resize.resizePreview || parseFloat(style?.height) || 0;
    const width = parseWidthPercent(style?.width);
    const className = buildClassName(isDragging, resize.isResizing);
    const renderStyle = buildStyle(style, resize.resizePreview, theme);

    return (
        <div ref={refs.event} className={className} style={renderStyle} onClick={onClick} {...dragProps}>
            <EventContent event={event} height={height} width={width} minWidth={minWidth} />
            <ResizeHandle onStart={resize.handleResizeStart} />
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
    const showTime = height >= 30 && width >= minWidth;
    const showDesc = height >= 60 && width >= minWidth;
    return (
        <div className="event-content">
            <div className="event-title">{event.title}</div>
            {showTime && <TimeDisplay event={event} />}
            {showDesc && event.description && <div className="event-description">{event.description}</div>}
        </div>
    );
}

function TimeDisplay({ event }) {
    const startTime = formatTime(new Date(event.start_time));
    const endTime = formatTime(new Date(event.end_time));
    return <div className="event-time">{startTime} - {endTime}</div>;
}

function buildStyle(baseStyle, resizePreview, theme) {
    const style = { ...baseStyle };
    if (resizePreview) style.height = `${resizePreview}px`;
    style.borderLeftColor = theme ? theme.color : '#8B7355';
    return style;
}

function buildClassName(isDragging, isResizing) {
    let className = 'draggable-event';
    if (isDragging) className += ' dragging';
    if (isResizing) className += ' resizing';
    return className;
}
