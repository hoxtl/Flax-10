import { useCalendarDispatch } from '../../../context/CalendarContext';
import { useHoverSummary } from '../hooks/useHoverSummary';
import { isToday, overlapsDay } from '../utils/dateUtils';
import { HoverSummary } from './HoverSummary';

export function YearDay({ date, events }) {
    const dispatch = useCalendarDispatch();
    const { showSummary, binder } = useHoverSummary(2000);
    const dayEvents = getEventsForDay(events, date);
    const className = getDayClass(date, dayEvents);
    const onClick = () => handleDayClick(dispatch, date);
    return (
        <div className={className} onClick={onClick} {...binder}>
            {date.getDate()}
            {showSummary && <HoverSummary events={dayEvents} date={date} />}
        </div>
    );
}

function getEventsForDay(events, date) {
    return events.filter(e => overlapsDay(new Date(e.start_time), new Date(e.end_time), date));
}

function getDayClass(date, events) {
    let cls = 'year-day';
    if (isToday(date)) cls += ' today';
    if (events.length > 0) cls += ' has-events';
    return cls;
}

function handleDayClick(dispatch, date) {
    dispatch({ type: 'SET_SELECTED_DATE', payload: date });
    dispatch({ type: 'SET_VIEW_MODE', payload: 'day' });
}
