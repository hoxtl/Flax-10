import { useDrag } from '../hooks/useDragDrop';
import { useEventPopup } from '../../../context/CalendarContext';
import { useTags } from '../../../context/TagContext';
import { getEventType } from '../utils/eventUtils';
import { getEventTheme } from '../utils/eventStyleUtils';

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
    const theme = getEventTheme(event, globalTags);
    const { dragProps, isDragging } = useDrag({ type: 'EVENT', data: event });

    const handleClick = (ev) => {
        ev.stopPropagation();
        const rect = ev.currentTarget.getBoundingClientRect();
        if (onEventClick) onEventClick(event, rect);
        else openPopup(event, rect);
    };

    return {
        color: theme.color,
        className: getEventClassName(eventType, isDragging),
        onClick: handleClick,
        dragProps
    };
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
