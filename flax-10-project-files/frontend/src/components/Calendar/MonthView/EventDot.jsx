import { useDrag } from '../hooks/useDragDrop';
import { useEventModal } from '../../../context/CalendarContext';
import { useTags } from '../../../context/TagContext';

export function EventDot({ e, onEventClick, customTags }) {
    const isSocietyEvent = e.source === 'society';
    const { color, className, onClick, dragProps } = useEventDotLogic(e, onEventClick, customTags, isSocietyEvent);

    return (
        <div className={className} title={getTitle(e)} onClick={onClick}
            style={{ backgroundColor: color, color: 'white', borderLeft: 'none' }}
            {...(isSocietyEvent ? {} : dragProps)}>
            {isSocietyEvent && <span className="society-indicator">●</span>}
            {e.title}
        </div>
    );
}

function getTitle(event) {
    if (event.source === 'society') return `${event.title} (${event.society_name})`;
    return event.title;
}

function useEventDotLogic(event, onEventClick, customTags, isSociety) {
    const { openModal } = useEventModal();
    const globalTags = useTags();
    const { dragProps, isDragging } = useDrag({ type: 'EVENT', data: event });

    const handleClick = (ev) => {
        ev.stopPropagation();
        if (isSociety) return;
        if (onEventClick) onEventClick(event, ev.currentTarget.getBoundingClientRect());
        else openModal(event);
    };

    return {
        color: getEventColor(event, customTags, globalTags),
        className: getEventClassName(isDragging, isSociety),
        onClick: handleClick,
        dragProps
    };
}

function getEventColor(event, customTags, globalTags) {
    if (event.source === 'society') return event.society_color || '#9E7E5D';
    if (event.tag_color) return event.tag_color;
    if (customTags) return customTags.find(t => t.id === event.tagId)?.color || '#9E7E5D';
    return globalTags.getTag(event.tag)?.color || '#9E7E5D';
}

function getEventClassName(isDragging, isSociety) {
    let className = 'month-event-dot';
    if (isDragging && !isSociety) className += ' dragging';
    if (isSociety) className += ' society-event';
    return className;
}

export function MoreEvents({ count }) {
    return <span className="more-events">+{count} more</span>;
}
