import { useRef } from 'react';
import { useCalendar } from '../../../context/CalendarContext';
import { isSameDay, overlapsDay, isAllDayEvent } from '../../../utils/dateUtils';
import { shouldShowInTimeGrid } from '../../../utils/eventDisplayUtils';
import { TimeSlot } from './TimeSlot';
import { AllDayRow } from '../WeekView/components/AllDayRow';
import { DraggableEvent } from '../DraggableEvent';
import { getHoursOfDay, calculateEventStyle } from './dayViewHelpers';
import { SLOT_HEIGHT } from '../calendarConstants';
import { useAutoScroll } from '../../../hooks/useAutoScroll';
import './DayView.css';

export function DayView() {
    const { selectedDate, events } = useCalendar();
    const scrollRef = useRef(null);
    const dayEventsCombined = filterEventsForDay(events, selectedDate);
    const timedEvents = dayEventsCombined.filter(e => shouldShowInTimeGrid(e, selectedDate));
    useAutoScroll(scrollRef, timedEvents);
    const hours = getHoursOfDay();
    return (
        <div className="day-view" ref={scrollRef}>
            <div className="sticky-header">
                <AllDayRow days={[selectedDate]} events={dayEventsCombined} />
            </div>
            <div className="day-grid-container">
                <TimeLabelsColumn hours={hours} />
                <DayGrid hours={hours} date={selectedDate} events={timedEvents} />
            </div>
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
    return events.filter(e => overlapsDay(new Date(e.start_time), new Date(e.end_time), date));
}

function formatHour(hour) {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}
