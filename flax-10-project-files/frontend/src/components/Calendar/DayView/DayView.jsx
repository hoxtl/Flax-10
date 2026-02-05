import { useRef } from 'react';
import { useCalendar } from '../../../context/CalendarContext';
import { isSameDay } from '../../../utils/dateUtils';
import { TimeSlot } from './TimeSlot';
import { DraggableEvent } from '../DraggableEvent';
import { getHoursOfDay, calculateEventStyle } from './dayViewHelpers';
import { SLOT_HEIGHT } from '../calendarConstants';
import './DayView.css';

/**
 * Shows a single day with 24 hour slots.
 * Events are positioned absolutely based on their start time and duration.
 * You can drag events to move them, drag the bottom edge to resize.
 */
export function DayView() {
    const { selectedDate, events } = useCalendar();
    const gridRef = useRef(null);
    const hours = getHoursOfDay(); // 1 - 23
    const dayEvents = filterEventsForDay(events, selectedDate);
    // Hour slot backgrounds - these handle drops
    const slots = hours.map(hour => (<TimeSlot key={hour} hour={hour} date={selectedDate} />));
    // Events layer - positioned absolutely on top of slots
    const eventsLayer = dayEvents.map(e => (
        <DraggableEvent key={e.id} event={e} style={calculateEventStyle(e, SLOT_HEIGHT)} date={selectedDate} />
    ));
    return <div className="day-view time-grid" ref={gridRef}>{slots}{eventsLayer}</div>;
}

// Only keeps events that start on the selected day
function filterEventsForDay(events, date) {
    return events.filter(event => isSameDay(new Date(event.start_time), date));
}