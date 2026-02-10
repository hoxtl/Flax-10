import { useDrag } from '../../../hooks/useDragDrop';
import { useEventModal } from '../../../context/CalendarContext'; // Fix import path if needed
import { useTags } from '../../../context/TagContext';

export function EventDot({ e }) {
    const { openModal } = useEventModal();
    const { getTag } = useTags();
    const { dragProps, isDragging } = useDrag({ type: 'EVENT', data: e });

    const tag = getTag(e.tag);
    const color = tag?.color || '#3b82f6';

    const onClick = (ev) => {
        ev.stopPropagation();
        openModal(e);
    };
    const className = isDragging ? 'month-event-dot dragging' : 'month-event-dot';

    return (
        <div
            className={className}
            title={e.title}
            onClick={onClick}
            style={{ backgroundColor: color, color: 'white', borderLeft: 'none' }}
            {...dragProps}
        >
            {e.title}
        </div>
    );
}

export function MoreEvents({ count }) {
    return <span className="more-events">+{count} more</span>;
}
