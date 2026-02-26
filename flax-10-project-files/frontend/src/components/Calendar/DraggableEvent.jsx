import { useRef } from 'react';
import { useDrag } from './hooks/useDragDrop';
import { useEventActions } from './hooks/useCalendarEvents';
import { useEventModal, useEventPopup } from '../../context/CalendarContext';
import { useEventResize } from './hooks/useEventResize';
import { formatTime } from './utils/dateUtils';
import { getEventType } from './utils/eventUtils';
import { useTags } from '../../context/TagContext';
import './DraggableEvent.css';

export function DraggableEvent({ event, style, minWidthForDetails = 80, readOnly }) {
    const eventType = getEventType(event);
    if (eventType !== 'personal' || readOnly) {
        return <ReadOnlyEvent event={event} style={style} minWidth={minWidthForDetails} />;
    }
    return <EditableEvent event={event} style={style} minWidthForDetails={minWidthForDetails} />;
}

function ReadOnlyEvent({ event, style, minWidth }) {
    const { openPopup } = useEventPopup();
    const height = parseFloat(style?.height) || 0;
    const width = parseWidthPercent(style?.width);
    const eventStyle = buildReadOnlyStyle(style, event);
    const className = getReadOnlyClassName(event);

    const handleClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        openPopup(event, rect);
    };

    return (
        <div className={className} style={eventStyle} onClick={handleClick}>
            <EventContent event={event} height={height} width={width} minWidth={minWidth} />
        </div>
    );
}

function getReadOnlyClassName(event) {
    const type = getEventType(event);
    if (type === 'society') return 'draggable-event society-event';
    if (type === 'module' || type === 'timetable') return 'draggable-event timetable-event';
    return 'draggable-event';
}

function EditableEvent({ event, style, minWidthForDetails }) {
    const { editEvent } = useEventActions();
    const { openPopup } = useEventPopup();
    const theme = useTags().getTag(event.tag);
    const refs = { event: useRef(null), resizeEnded: useRef(false) };
    const { dragProps, isDragging } = useDrag({ type: 'EVENT', data: event });
    const resize = useEventResize(event, refs.event, editEvent, refs.resizeEnded);

    const onClick = (e) => {
        if (refs.resizeEnded.current) { refs.resizeEnded.current = false; return; }
        if (isDragging || resize.isResizing) return;
        const rect = refs.event.current?.getBoundingClientRect();
        openPopup(event, rect);
    };

    return (
        <EventCard event={event} style={style} theme={theme} refs={refs}
            resize={resize} isDragging={isDragging} dragProps={dragProps}
            onClick={onClick} minWidth={minWidthForDetails} />
    );
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
    const isSociety = event.source === 'society';

    return (
        <div className="event-content">
            <div className="event-title">
                {isSociety && <span className="society-badge">●</span>}
                {event.title}
            </div>
            {isSociety && showTime && <div className="society-name">{event.society_name}</div>}
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

function buildReadOnlyStyle(baseStyle, event) {
    const style = { ...baseStyle };
    if (event.source === 'society' && event.society_color) {
        style.borderLeftColor = event.society_color;
    }
    return style;
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
