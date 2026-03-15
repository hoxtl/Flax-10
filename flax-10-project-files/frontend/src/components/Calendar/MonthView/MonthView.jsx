import { useCalendar, useCalendarDispatch } from '../../../context/CalendarContext';
import { getMonthWeeks } from '../utils/dateUtils';
import { WeekdayHeader } from './WeekdayHeader';
import { WeekRow } from './WeekRow';
import './MonthView.css';

export function MonthView({ selectedDate, events, onDateSelect, readOnly, onEventClick, onMoreClick, customTags }) {
    const { selectedDate: contextDate, events: contextEvents, readOnly: contextReadOnly } = useCalendar();
    const dispatch = useCalendarDispatch();
    const cur = selectedDate || contextDate;
    const evs = events || contextEvents || [];
    const isReadOnly = readOnly ?? contextReadOnly;

    const navToDay = (date) => {
        dispatch?.({ type: 'SET_SELECTED_DATE', payload: date });
        dispatch?.({ type: 'SET_VIEW_MODE', payload: 'day' });
    };

    return (
        <div className="month-view">
            <MonthGrid
                cur={cur} events={evs} onDateSelect={onDateSelect} readOnly={isReadOnly}
                onEventClick={onEventClick} onMoreClick={onMoreClick || navToDay} customTags={customTags}
            />
        </div>
    );
}

function MonthGrid({ cur, events, onDateSelect, readOnly, onEventClick, onMoreClick, customTags }) {
    const weeks = getMonthWeeks(cur);
    return (
        <div className="month-grid">
            <WeekdayHeader />
            {weeks.map((w, i) => (
                <WeekRow key={i} days={w} events={events} cur={cur} onDateSelect={onDateSelect}
                    readOnly={readOnly} onEventClick={onEventClick} onMoreClick={onMoreClick} customTags={customTags} />
            ))}
        </div>
    );
}