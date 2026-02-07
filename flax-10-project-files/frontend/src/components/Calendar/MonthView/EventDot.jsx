import { useDrag } from '../../../hooks/useDragDrop';
import { useEventModal } from '../../../context/CalendarContext';

export function EventDot({ e }) {
    const { openModal } = useEventModal();
    const { dragProps, isDragging } = useDrag({ type: 'EVENT', data: e });
    const onClick = (ev) => {
        ev.stopPropagation();
        openModal(e);
    };
    const className = isDragging ? 'month-event-dot dragging' : 'month-event-dot';
    return <div className={className} title={e.title} onClick={onClick} {...dragProps}>{e.title}</div>;
}

export function MoreEvents({ count }) {
    return <span className="more-events">+{count} more</span>;
}
