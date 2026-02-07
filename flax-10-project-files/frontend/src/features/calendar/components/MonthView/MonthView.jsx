import { useCalendar, useCalendarDispatch, useEventModal } from '../../context/CalendarContext';
import { isSameDay, isSameMonth } from '../../utils/dateUtils';
import { useDrag } from '../../hooks/useDragDrop';
import { useMonthDayDrop } from '../../hooks/useMonthDayDrop';
import './MonthView.css';

/*
    Shows full month view of the calendar.
*/
export function MonthView() {
    const { selectedDate, events } = useCalendar();
    const dispatch = useCalendarDispatch();
    const weeks = getMonthWeeks(selectedDate);
    return (
        <div className="month-view">
            <WeekdayHeader />
            <div className="month-grid">
                {weeks.map((week, i) => (
                    <WeekRow key={i} days={week} events={events} cur={selectedDate} dispatch={dispatch} />
                ))}
            </div>
        </div>
    );
}

/*
    Weekday header showing day names.
*/
function WeekdayHeader() {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
        <div className="weekday-header">
            {days.map(d => <div key={d} className="weekday-label">{d}</div>)}
        </div>
    );
}

/*
    Week row showing 7 days.
*/
function WeekRow({ days, events, cur, dispatch }) {
    return (
        <div className="week-row">
            {days.map(d => (
                <DayCell key={d.toISOString()} day={d} events={getEventsForDay(events, d)} isCur={isSameMonth(d, cur)} dispatch={dispatch} />
            ))}
        </div>
    );
}

/*
    Day cell showing the day number and events.
*/
function DayCell({ day, events, isCur, dispatch }) {
    const isToday = isSameDay(day, new Date());
    const { dropProps, isOver } = useMonthDayDrop(day);
    const cellProps = mergeDayProps(dropProps, dispatch, day);
    const className = buildCellClass(isCur, isToday, isOver);

    return (
        <div className={className} {...cellProps}>
            <span className="day-number">{day.getDate()}</span>
            <AddEventBtn day={day} />
            <DayEvents events={events} />
        </div>
    );
}

function AddEventBtn({ day }) {
    const { openModal } = useEventModal();
    const onClick = (e) => {
        e.stopPropagation();
        openModal(createDraftEvent(day));
    };
    return <button className="month-add-btn" onClick={onClick}>+</button>;
}

function createDraftEvent(date) {
    const start = new Date(date);
    start.setHours(9, 0, 0, 0);
    const end = new Date(start);
    end.setHours(10, 0, 0, 0);
    return { start_time: start, end_time: end };
}

function handleDayClick(dispatch, day) {
    dispatch({ type: 'SET_SELECTED_DATE', payload: day });
    dispatch({ type: 'SET_VIEW_MODE', payload: 'day' });
}

/*
    Day events showing the events for the given day.
*/
function DayEvents({ events }) {
    return (
        <div className="day-events">
            {events.slice(0, 3).map(e => <EventDot key={e.id} e={e} />)}
            {events.length > 3 && <MoreEvents count={events.length - 3} />}
        </div>
    );
}

/*
    Event dot showing the event title.
*/
function EventDot({ e }) {
    const { openModal } = useEventModal();
    const { dragProps, isDragging } = useDrag({ type: 'EVENT', data: e });
    const onClick = (ev) => {
        ev.stopPropagation();
        openModal(e);
    };
    const className = isDragging ? 'month-event-dot dragging' : 'month-event-dot';
    return <div className={className} title={e.title} onClick={onClick} {...dragProps}>{e.title}</div>;
}

/*
    More events showing the number of additional events.
*/
function MoreEvents({ count }) {
    return <span className="more-events">+{count} more</span>;
}

/*
    Build cell class based on whether it is the current month or today.
*/
function mergeDayProps(dropProps, dispatch, day) {
    return {
        ...dropProps,
        onClick: () => handleDayClick(dispatch, day)
    };
}

function buildCellClass(isCurrentMonth, isToday, isOver) {
    let cls = 'day-cell';
    if (!isCurrentMonth) cls += ' other-month';
    if (isToday) cls += ' is-today';
    if (isOver) cls += ' drop-over';
    return cls;
}

/*
    Get events for the given day.
*/
function getEventsForDay(events, date) {
    return events
        .filter(e => isSameDay(new Date(e.start_time), date))
        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
}

/*
    Get weeks for the given date.
*/
function getMonthWeeks(date) {
    const weeks = [];
    const current = getStartDate(date);
    const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    while (current <= last || current.getDay() !== 0) {
        weeks.push(generateWeek(current));
        if (current > last && current.getDay() === 0) break;
    }
    return weeks;
}

function getStartDate(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), 1);
    d.setDate(d.getDate() - d.getDay());
    return d;
}

function generateWeek(current) {
    const week = [];
    for (let i = 0; i < 7; i++) {
        week.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }
    return week;
}