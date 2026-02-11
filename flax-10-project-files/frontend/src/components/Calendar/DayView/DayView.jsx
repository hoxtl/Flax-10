import { useRef } from 'react';
import { useCalendar } from '../../../context/CalendarContext';
import { overlapsDay } from '../../../utils/dateUtils';
import { shouldShowInTimeGrid } from '../../../utils/eventDisplayUtils';
import { TimeSlot } from './TimeSlot';
import { AllDayRow } from '../WeekView/components/AllDayRow';
import { DraggableEvent } from '../DraggableEvent';
import { getHoursOfDay, calculateEventStyle } from './dayViewHelpers';
import { SLOT_HEIGHT } from '../calendarConstants';
import { useAutoScroll } from '../../../hooks/useAutoScroll';
import './DayView.css';

export function DayView() {
    const { events } = useCalendar();
    const { selectedDate, timedEvents, allEvents, scrollRef } = useDayViewData(events);

    return (
        <div className="day-view" ref={scrollRef}>
            <div className="sticky-header"><AllDayRow days={[selectedDate]} events={allEvents} /></div>
            <div className="day-grid-container">
                <TimeLabelsColumn hours={getHoursOfDay()} />
                <DayGrid hours={getHoursOfDay()} date={selectedDate} events={timedEvents} />
            </div>
        </div>
    );
}

function useDayViewData(events) {
    const { selectedDate } = useCalendar();
    const scrollRef = useRef(null);
    const allEvents = filterEventsForDay(events, selectedDate);
    const timedEvents = allEvents.filter(e => shouldShowInTimeGrid(e, selectedDate));
    useAutoScroll(scrollRef, timedEvents, selectedDate.toISOString());
    return { selectedDate, timedEvents, allEvents, scrollRef };
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
            {hours.map(hour => <TimeSlot key={hour} hour={hour} date={date} />)}
            <EventsLayer events={events} date={date} />
        </div>
    );
}

function EventsLayer({ events, date }) {
    return (
        <div className="events-layer">
            {events.map(e => (
                <DraggableEvent key={e.id} event={e}
                    style={calculateEventStyle(e, SLOT_HEIGHT, events, date)} minWidthForDetails={25} />
            ))}
        </div>
    );
}

function filterEventsForDay(events, date) {
    return events.filter(e => overlapsDay(new Date(e.start_time), new Date(e.end_time), date));
}

function formatHour(hour) {
    const period = hour < 12 ? 'AM' : 'PM';
    const displayHour = hour % 12 || 12;
    return `${displayHour} ${period}`;
}
