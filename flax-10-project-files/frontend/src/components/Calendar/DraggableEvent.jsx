import { useRef } from 'react';
import { Circle } from 'lucide-react';
import { useDrag } from './hooks/useDragDrop';
import { useEventActions } from './hooks/useCalendarEvents';
import { useEventModal, useEventPopup } from '../../context/CalendarContext';
import { useEventResize } from './hooks/useEventResize';
import { formatTime } from './utils/dateUtils';
import { getEventType } from './utils/eventUtils';
import { useTags } from '../../context/TagContext';
import './DraggableEvent.css';

export function DraggableEvent({ event, style, readOnly }) {
    const eventType = getEventType(event);
    if (readOnly || eventType !== 'personal') return <ReadOnlyEvent event={event} style={style} />;
    return <EditableEvent event={event} style={style} />;
}

function ReadOnlyEvent({ event, style }) {
    const { openPopup } = useEventPopup();
    const height = parseFloat(style?.height) || 0;
    const eventStyle = buildReadOnlyStyle(style, event);
    const className = getReadOnlyClassName(event);

    const handleClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        openPopup(event, rect);
    };

    return (
        <div className={className} style={eventStyle} onClick={handleClick}>
            <EventContent event={event} height={height} />
        </div>
    );
}

function getReadOnlyClassName(event) {
    const type = getEventType(event);
    if (type === 'society') return 'draggable-event society-event';
    if (type === 'module' || type === 'timetable') return 'draggable-event timetable-event';
    return 'draggable-event';
}

function EditableEvent({ event, style }) {
  const { openPopup } = useEventPopup();
  const { editEvent } = useEventActions();
    const theme = useTags().getTag(event.tag);
  const refs = useEventRefs();
  const { dragProps, isDragging } = useDrag({ type: 'EVENT', data: event });
  const resize = useEventResize(event, refs.event, editEvent, refs.resizeEnded);
  const onClick = createPopupClickHandler(refs, isDragging, resize.isResizing, openPopup, event);
  const onContextMenu = createPopupContextHandler(refs, isDragging, resize.isResizing, openPopup, event);

  return (
    <EventCard event={event} style={style} theme={theme} refs={refs}
      resize={resize} isDragging={isDragging} dragProps={dragProps}
      onClick={onClick} onContextMenu={onContextMenu} />
  );
}

function useEventRefs() {
    return { event: useRef(null), resizeEnded: useRef(false) };
}

function createPopupClickHandler(refs, isDragging, isResizing, openPopup, event) {
  return (e) => {
    if (refs.resizeEnded.current) { refs.resizeEnded.current = false; return; }
    if (isDragging || isResizing) return;
    const rect = refs.event.current?.getBoundingClientRect();
    openPopup(event, rect);
  };
}

function createPopupContextHandler(refs, isDragging, isResizing, openPopup, event) {
  return (e) => {
    e.preventDefault();
    if (refs.resizeEnded.current) { refs.resizeEnded.current = false; return; }
    if (isDragging || isResizing) return;
    const rect = refs.event.current?.getBoundingClientRect();
    openPopup(event, rect);
  };
}

function EventCard({ event, style, theme, refs, resize, isDragging, dragProps, onClick, onContextMenu }) {
  const height = resize.resizePreview || parseFloat(style?.height) || 0;
  const className = buildClassName(isDragging, resize.isResizing);
  const renderStyle = buildStyle(style, resize.resizePreview, theme);

  return (
    <div ref={refs.event} className={className} style={renderStyle} onClick={onClick} onContextMenu={onContextMenu} {...dragProps}>
      <EventContent event={event} height={height} />
      <ResizeHandle onStart={resize.handleResizeStart} />
    </div>
  );
}


function ResizeHandle({ onStart }) {
    const onMouseDown = (e) => { e.stopPropagation(); e.preventDefault(); onStart(e); };
    return <div className="resize-handle" draggable={false} onMouseDown={onMouseDown} />;
}

function EventContent({ event, height }) {
    const isCompact = height < 36;
    const showTime = !isCompact && height >= 20;
    const showDesc = height >= 50;
    const isSociety = event.source === 'society';

    if (isCompact) {
        const startTime = formatTime(new Date(event.start_time));
        return (
            <div className="event-content">
                <div className="event-title">
                    {isSociety && <Circle size={5} style={{ flexShrink: 0 }} />}
                    <span className="event-title-text">{event.title} · {startTime}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="event-content">
            <div className="event-title">
                {isSociety && <Circle size={6} style={{ flexShrink: 0 }} />}
                <span className="event-title-text">{event.title}</span>
            </div>
            {isSociety && showTime && <div className="society-name">{event.society_name}</div>}
            {showTime && <TimeDisplay event={event} />}
            {showDesc && event.description && !event.title.includes(event.description) && <div className="event-description">{event.description}</div>}
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
