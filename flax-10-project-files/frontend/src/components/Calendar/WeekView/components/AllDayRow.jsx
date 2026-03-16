import { useMemo } from 'react';
import { getAllDayVisualRange } from '../../utils/eventDisplayUtils';
import { useEventPopup } from '../../../../context/CalendarContext';
import { useTags } from '../../../../context/TagContext';
import { calculateEventLayout } from './allDayRowHelpers';
import { getEventTheme } from '../../utils/eventStyleUtils';
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
    const tags = useTags();
    const theme = getEventTheme(event, tags);

    const style = {
        gridColumnStart: startCol,
        gridColumnEnd: endCol,
        gridRow: row,
        backgroundColor: theme.color
    };

    const handleClick = (ev) => {
        ev.stopPropagation();
        const rect = ev.currentTarget.getBoundingClientRect();
        openPopup(event, rect);
    };

    return (
        <div className="all-day-event-bar" style={style} onClick={handleClick} data-event-id={event.id}>
            {event.title}
        </div>
    );
}
