import { memo } from 'react';
import { useMonthDayDrop } from '../hooks/useMonthDayDrop';
import { useEventModal } from '../../../context/CalendarContext';
import { isSameDay } from '../utils/dateUtils';
import { DayEvents } from './DayEvents';

export const DayCell = memo(function DayCell(props) {
    const Cell = props.readOnly ? ReadOnlyDayCell : EditableDayCell;
    return <Cell {...props} />;
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
    const { dropProps, isOver } = useMonthDayDrop(day);
    const isToday = isSameDay(day, new Date());
    const props = { ...dropProps, className: buildCellClass(isCur, isToday, isOver), onClick: () => onDateSelect?.(day) };

    return (
        <div {...props}>
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

function buildCellClass(isCurrentMonth, isToday, isOver) {
    let cls = 'day-cell';
    if (!isCurrentMonth) cls += ' other-month';
    if (isToday) cls += ' is-today';
    if (isOver) cls += ' drop-over';
    return cls;
}
