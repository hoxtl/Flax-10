import { useDrag } from '../hooks/useDragDrop';
import { useEventPopup } from '../../../context/CalendarContext';
import { useTags } from '../../../context/TagContext';
import { getEventType } from '../utils/eventUtils';

export function EventDot({ e, onEventClick, customTags }) {
    const eventType = getEventType(e);
    const isReadOnly = eventType !== 'personal';
    const { color, className, onClick, dragProps } = useEventDotLogic(e, onEventClick, customTags, eventType);

    return (
        <div className={className} title={getTitle(e)} onClick={onClick}
            style={{ backgroundColor: color, color: 'white', borderLeft: 'none' }}
            {...(isReadOnly ? {} : dragProps)}>
            {eventType === 'society' && <span className="society-indicator">●</span>}
            {e.title}
        </div>
    );
}

function getTitle(event) {
    if (event.source === 'society') return `${event.title} (${event.society_name})`;
    return event.title;
}

function useEventDotLogic(event, onEventClick, customTags, eventType) {
    const { openPopup } = useEventPopup();
    const globalTags = useTags();
    const { dragProps, isDragging } = useDrag({ type: 'EVENT', data: event });

    const handleClick = (ev) => {
        ev.stopPropagation();
        const rect = ev.currentTarget.getBoundingClientRect();
        if (onEventClick) onEventClick(event, rect);
        else openPopup(event, rect);
    };

    return {
        color: getEventColor(event, customTags, globalTags),
        className: getEventClassName(eventType, isDragging),
        onClick: handleClick,
        dragProps
    };
}

const TIMETABLE_COLOR = '#6B8CAE';  // muted blue for module/timetable lectures

function getEventColor(event, customTags, globalTags) {
    const type = getEventType(event);
    if (type === 'society') return event.society_color || '#9E7E5D';
    if (type === 'module' || type === 'timetable') return TIMETABLE_COLOR;
    if (event.tag_color) return event.tag_color;
    if (customTags) return customTags.find(t => t.id === event.tagId)?.color || '#9E7E5D';
    return globalTags.getTag(event.tag)?.color || '#9E7E5D';
}

function getEventClassName(eventType, isDragging) {
    let className = 'month-event-dot';
    if (isDragging && eventType === 'personal') className += ' dragging';
    if (eventType === 'society') className += ' society-event';
    else if (eventType !== 'personal') className += ' timetable-event';
    return className;
}

export function MoreEvents({ count }) {
    return <span className="more-events">+{count} more</span>;
}
