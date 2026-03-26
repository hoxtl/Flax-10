/**
 * AllDayRow - Displays all-day events spanning multiple days in week view.
 * Renders events as horizontal bars positioned across day columns.
 */
<<<<<<< HEAD:flax-10-project-files/frontend/src/components/Calendar/week_view/components/AllDayRow.jsx

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration):flax-10-project-files/frontend/src/components/Calendar/WeekView/components/AllDayRow.jsx
import { useMemo } from 'react';
import { getAllDayVisualRange } from '../../utils/eventDisplayUtils';
import { useEventPopup } from '../../../../context/CalendarContext';
import { useTags } from '../../../../context/TagContext';
import { calculateEventLayout } from './allDayRowHelpers';
import { getEventTheme } from '../../utils/eventStyleUtils';
import './all-day-row.css';

/** Row component displaying all-day events as spanning bars. */

/** Row component displaying all-day events as spanning bars. */
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

function buildBarStyle(startCol, endCol, row, color) {
    return { gridColumnStart: startCol, gridColumnEnd: endCol, gridRow: row, backgroundColor: color };
}

function useAllDayBarState(event) {
    const { openPopup } = useEventPopup();
    const tags = useTags();
    const theme = getEventTheme(event, tags);
    const handleClick = (ev) => { ev.stopPropagation(); openPopup(event, ev.currentTarget.getBoundingClientRect()); };
    return { theme, handleClick };
}

function AllDayEventBar({ item, readOnly }) {
    const { event, startCol, endCol, row } = item;
    const { theme, handleClick } = useAllDayBarState(event);
    return (
        <div className="all-day-event-bar" style={buildBarStyle(startCol, endCol, row, theme.color)} onClick={handleClick} data-event-id={event.id}>
            {event.title}
        </div>
    );
}
