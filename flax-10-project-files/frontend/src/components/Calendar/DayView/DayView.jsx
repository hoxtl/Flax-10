import { useRef } from 'react';
import { useCalendar } from '../../../context/CalendarContext';
import { isSameDay } from '../../../utils/dateUtils';
import { TimeSlot } from './TimeSlot';
import { DraggableEvent } from '../DraggableEvent';
import { getHoursOfDay, calculateEventStyle } from './dayViewHelpers';
import { SLOT_HEIGHT } from '../calendarConstants';
import { useAutoScroll } from '../../../hooks/useAutoScroll';
import './DayView.css';

export function DayView() {
    const { selectedDate, events } = useCalendar();
    const scrollRef = useRef(null);
    const dayEvents = filterEventsForDay(events, selectedDate);
    useAutoScroll(scrollRef, dayEvents);
    const hours = getHoursOfDay();

    return (
        <div className="day-view" ref={scrollRef}>
            <TimeLabelsColumn hours={hours} />
            <DayGrid hours={hours} date={selectedDate} events={dayEvents} />
        </div>
    );
}

function TimeLabelsColumn({ hours }) {
    return (
        <div className="time-labels-column">
            {hours.map(hour => (
                <div key={hour} className="time-label-row">
                    <span className="time-label-text">{formatHour(hour)}</span>
                </div>
            ))}
        </div>
    );
}

function DayGrid({ hours, date, events }) {
    return (
        <div className="day-grid">
            {hours.map(hour => (
                <TimeSlot key={hour} hour={hour} date={date} />
            ))}
            <div className="events-layer">
                {events.map(e => (
                    <DraggableEvent
                        key={e.id}
                        event={e}
                        style={calculateEventStyle(e, SLOT_HEIGHT, events, date)}
                    />
                ))}
            </div>
        </div>
    );
}

function filterEventsForDay(events, date) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return events.filter(event => {
        const start = new Date(event.start_time);
        const end = new Date(event.end_time);
        return start < dayEnd && end > dayStart;
    });
}

function formatHour(hour) {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}
