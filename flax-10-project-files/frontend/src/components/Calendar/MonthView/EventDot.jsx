import { useDrag } from '../../../hooks/useDragDrop';
import { useEventModal } from '../../../context/CalendarContext';
import { useTags } from '../../../context/TagContext';

export function EventDot({ e }) {
    const { color, className, onClick, dragProps } = useEventDotLogic(e);

    return (
        <div className={className} title={e.title} onClick={onClick}
            style={{ backgroundColor: color, color: 'white', borderLeft: 'none' }}
            {...dragProps}>
            {e.title}
        </div>
    );
}

function useEventDotLogic(event) {
    const { openModal } = useEventModal();
    const { getTag } = useTags();
    const { dragProps, isDragging } = useDrag({ type: 'EVENT', data: event });

    return {
        color: getEventColor(event, getTag),
        className: getEventClassName(isDragging),
        onClick: (ev) => { ev.stopPropagation(); openModal(event); },
        dragProps
    };
}

function getEventColor(event, getTag) {
    const tag = getTag(event.tag);
    return tag?.color || '#3b82f6';
}

function getEventClassName(isDragging) {
    return isDragging ? 'month-event-dot dragging' : 'month-event-dot';
}

export function MoreEvents({ count }) {
    return <span className="more-events">+{count} more</span>;
}
