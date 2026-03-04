import { useMemo } from 'react';
import { getAllDayVisualRange } from '../../utils/eventDisplayUtils';
import { useEventPopup } from '../../../../context/CalendarContext';
import { useTags } from '../../../../context/TagContext';
import { calculateEventLayout } from './allDayRowHelpers';
import './AllDayRow.css';

export function AllDayRow({ days, events, readOnly }) {
    const layoutItems = useMemo(() => calculateEventLayout(events, days), [events, days]);

    return (
        <div className="all-day-row">
            <div className="all-day-label">All-day</div>
            <div className="all-day-grid" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
                {days.map(d => <div key={d.toISOString()} className="all-day-cell" />)}
                {layoutItems.map(item => (
                    <AllDayEventBar key={item.event.id} item={item} readOnly={readOnly} />
                ))}
            </div>
        </div>
    );
}

function AllDayEventBar({ item, readOnly }) {
    const { event, startCol, endCol, row } = item;
    const { openPopup } = useEventPopup();
    const { getTag } = useTags();

    const tag = getTag ? getTag(event.tag) : null;
    const color = event.society_color || tag?.color || '#3b82f6';

    const style = {
        gridColumnStart: startCol,
        gridColumnEnd: endCol,
        gridRow: row,
        backgroundColor: color
    };

    const handleClick = (ev) => {
        ev.stopPropagation();
        const rect = ev.currentTarget.getBoundingClientRect();
        openPopup(event, rect);
    };

    return (
        <div className="all-day-event-bar" style={style} onClick={handleClick}>
            {event.title}
        </div>
    );
}
