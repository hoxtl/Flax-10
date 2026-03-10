import { memo } from 'react';
import { useMonthDayDrop } from '../hooks/useMonthDayDrop';
import { useEventModal } from '../../../context/CalendarContext';
import { isSameDay } from '../utils/dateUtils';
import { DayEvents } from './DayEvents';

export const DayCell = memo(function DayCell({ day, events, isCur, onDateSelect, readOnly, onEventClick, onMoreClick, customTags }) {
    if (readOnly) return <ReadOnlyDayCell day={day} events={events} isCur={isCur} onDateSelect={onDateSelect} onEventClick={onEventClick} onMoreClick={onMoreClick} customTags={customTags} />;
    return <EditableDayCell day={day} events={events} isCur={isCur} onDateSelect={onDateSelect} onEventClick={onEventClick} onMoreClick={onMoreClick} customTags={customTags} />;
});

function ReadOnlyDayCell({ day, events, isCur, onDateSelect, onEventClick, onMoreClick, customTags }) {
    const isToday = isSameDay(day, new Date());
    const className = buildCellClass(isCur, isToday, false);
    return (
        <div className={className} onClick={() => onDateSelect?.(day)}>
            <span className="day-number">{day.getDate()}</span>
            <DayEvents events={events} onEventClick={onEventClick} onMoreClick={() => onMoreClick?.(day)} customTags={customTags} />
        </div>
    );
}

function EditableDayCell({ day, events, isCur, onDateSelect, onEventClick, onMoreClick, customTags }) {
    const isToday = isSameDay(day, new Date());
    const { dropProps, isOver } = useMonthDayDrop(day);
    const cellProps = buildCellProps(dropProps, onDateSelect, day);
    const className = buildCellClass(isCur, isToday, isOver);

    return (
        <div className={className} {...cellProps}>
            <span className="day-number">{day.getDate()}</span>
            <AddEventBtn day={day} />
            <DayEvents events={events} onEventClick={onEventClick} onMoreClick={() => onMoreClick?.(day)} customTags={customTags} />
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

function buildCellProps(dropProps, onDateSelect, day) {
    return { ...dropProps, onClick: () => onDateSelect?.(day) };
}

function buildCellClass(isCurrentMonth, isToday, isOver) {
    let cls = 'day-cell';
    if (!isCurrentMonth) cls += ' other-month';
    if (isToday) cls += ' is-today';
    if (isOver) cls += ' drop-over';
    return cls;
}
