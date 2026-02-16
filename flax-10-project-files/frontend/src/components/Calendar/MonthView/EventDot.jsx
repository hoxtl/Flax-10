import { useDrag } from '../hooks/useDragDrop';
import { useEventModal } from '../../../context/CalendarContext';
import { useTags } from '../../../context/TagContext';

export function EventDot({ e, onEventClick, customTags }) {
    const { color, className, onClick, dragProps } = useEventDotLogic(e, onEventClick, customTags);

    return (
        <div className={className} title={e.title} onClick={onClick}
            style={{ backgroundColor: color, color: 'white', borderLeft: 'none' }}
            {...dragProps}>
            {e.title}
        </div>
    );
}

function useEventDotLogic(event, onEventClick, customTags) {
    const { openModal } = useEventModal();
    const globalTags = useTags();
    const { dragProps, isDragging } = useDrag({ type: 'EVENT', data: event });

    const handleClick = (ev) => {
        ev.stopPropagation();
        if (onEventClick) {
            const rect = ev.currentTarget.getBoundingClientRect();
            onEventClick(event, rect);
        } else openModal(event);
    };

    return {
        color: getEventColor(event, customTags, globalTags),
        className: getEventClassName(isDragging),
        onClick: handleClick,
        dragProps
    };
}

function getEventColor(event, customTags, globalTags) {
    if (event.tag_color) return event.tag_color;
    if (customTags) return customTags.find(t => t.id === event.tagId)?.color || '#9E7E5D';
    const tag = globalTags.getTag(event.tag);
    return tag?.color || '#9E7E5D';
}

function getEventClassName(isDragging) {
    return isDragging ? 'month-event-dot dragging' : 'month-event-dot';
}

export function MoreEvents({ count }) {
    return <span className="more-events">+{count} more</span>;
}
