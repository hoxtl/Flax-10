import { useRef } from 'react';
import { useCalendarData } from '../../../context/CalendarContext';
import { overlapsDay } from '../utils/dateUtils';
import { shouldShowInTimeGrid } from '../utils/eventDisplayUtils';
import { TimeSlot } from './TimeSlot';
import { AllDayRow } from '../WeekView/components/AllDayRow';
import { DraggableEvent } from '../DraggableEvent';
import { getSlotsOfDay, formatSlotLabel, calculateEventStyle } from './dayViewHelpers';
import { SLOT_HEIGHT, SLOT_INTERVAL_MINUTES } from '../calendarConstants';
import { useAutoScroll } from '../hooks/useAutoScroll';
import './DayView.css';

export function DayView({ selectedDate: propDate, events: propEvents, readOnly }) {
    const data = useCalendarData({ selectedDate: propDate, events: propEvents });
    const { selectedDate, timedEvents, allEvents, scrollRef } = useDayViewData(data.selectedDate, data.events);
    const slots = getDaySlots();

    return (
        <div className="day-view" ref={scrollRef}>
            <div className="sticky-header"><AllDayRow days={[selectedDate]} events={allEvents} readOnly={readOnly} /></div>
            <div className="day-grid-container">
                <TimeLabelsColumn slots={slots} />
                <DayGrid slots={slots} date={selectedDate} events={timedEvents} readOnly={readOnly} />
            </div>
        </div>
    );
}

function useDayViewData(selectedDate, events) {
    const scrollRef = useRef(null);
    const allEvents = filterEventsForDay(events, selectedDate);
    const timedEvents = allEvents.filter(e => shouldShowInTimeGrid(e, selectedDate));
    useAutoScroll(scrollRef, timedEvents, selectedDate.toISOString());
    return { selectedDate, timedEvents, allEvents, scrollRef };
}

function TimeLabelsColumn({ slots }) {
    return (
        <div className="time-labels-column">
            {slots.map(slotStartMinutes => (
                <div key={slotStartMinutes} className="time-label-row">
                    <span className="time-label-text">{formatSlotLabel(slotStartMinutes)}</span>
                </div>
            ))}
        </div>
    );
}

function DayGrid({ slots, date, events, readOnly }) {
    return (
        <div className="day-grid">
            {slots.map(slotStartMinutes => (
                <TimeSlot key={slotStartMinutes} slotStartMinutes={slotStartMinutes} date={date} readOnly={readOnly} />
            ))}
            <EventsLayer events={events} date={date} readOnly={readOnly} />
        </div>
    );
}

function EventsLayer({ events, date, readOnly }) {
    return (
        <div className="events-layer">
            {events.map(e => (
                <DraggableEvent key={e.id} event={e} readOnly={readOnly}
                    style={calculateEventStyle(e, SLOT_HEIGHT, events, date)} />
            ))}
        </div>
    );
}

function filterEventsForDay(events, date) {
    return events.filter(e => overlapsDay(new Date(e.start_time), new Date(e.end_time), date));
}

const getDaySlots = () => getSlotsOfDay(SLOT_INTERVAL_MINUTES);
