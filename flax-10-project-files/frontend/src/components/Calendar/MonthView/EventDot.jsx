/*
 * Month view event dot component.
 */
import { useDrag } from '../hooks/useDragDrop';
import { useEventPopup } from '../../../context/CalendarContext';
import { useTags } from '../../../context/TagContext';
import { getEventType } from '../utils/eventUtils';
import { getEventTheme } from '../utils/eventStyleUtils';
import dotStyles from './EventDot.module.css';

export function EventDot({ e, onEventClick, customTags, readOnly }) {
    const eventType = getEventType(e);
    const isReadOnly = readOnly || eventType !== 'personal';
    const { color, className, onClick, dragProps } = useEventDotLogic(e, onEventClick, customTags, eventType, readOnly);

    return (
        <button type="button" className={`${className} ${dotStyles.eventDotColored}`} title={getTitle(e)} onClick={onClick} data-event-id={e.id}
            style={{ '--dot-bg': color }}
            {...(isReadOnly ? {} : dragProps)}>
            {e.title}
        </button>
    );
}

function getTitle(event) {
    if (event.source === 'society') return `${event.title} (${event.society_name})`;
    return event.title;
}

function createDotClickHandler(event, onEventClick, openPopup, popupReadOnly) {
    return (ev) => { ev.stopPropagation(); const rect = ev.currentTarget.getBoundingClientRect(); if (onEventClick) onEventClick(event, rect); else openPopup(event, rect, popupReadOnly); };
}

function useEventDotLogic(event, onEventClick, customTags, eventType, readOnly) {
    const { openPopup } = useEventPopup();
    const globalTags = useTags();
    const theme = getEventTheme(event, globalTags);
    const { dragProps, isDragging } = useDrag({ type: 'EVENT', data: event });
    const popupReadOnly = readOnly || eventType !== 'personal';
    const handleClick = createDotClickHandler(event, onEventClick, openPopup, popupReadOnly);
    return { color: theme.color, className: getEventClassName(eventType, isDragging), onClick: handleClick, dragProps };
}

function getEventClassName(eventType, isDragging) {
    let className = 'month-event-dot';
    if (isDragging && eventType === 'personal') className += ' dragging';
    if (eventType === 'society') className += ' society-event';
    else if (eventType !== 'personal') className += ' timetable-event';
    return className;
}

export function MoreEvents({ count, onClick }) {
    return (
        <button
            type="button"
            className="more-events"
            onClick={(e) => {
                e.stopPropagation();
                onClick?.();
            }}
            style={{ cursor: 'pointer' }}
        >
            +{count} more
        </button>
    );
}
