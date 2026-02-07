import { useMonthDayDrop } from '../../../hooks/useMonthDayDrop';
import { useEventModal } from '../../../context/CalendarContext';
import { isSameDay } from '../../../utils/dateUtils';
import { DayEvents } from './DayEvents';

export function DayCell({ day, events, isCur, dispatch }) {
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
