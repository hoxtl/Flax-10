import { useCalendar } from "../../../context/CalendarContext";
import { isSameDay } from "../../../utils/dateUtils";
import { TimeSlot } from "./TimeSlot";
import { getHoursOfDay } from "./dayViewHelpers';
import './DayView.css';

/**
 * Shows a single day with 24 hour slots.
 * Each hour slot can display events and accept tag drops
 * this is the most detailed view
 */
export function DayView() {
    const { selectedDate, events } = useCalendar();
    const hours = getHoursOfDay(); // 1 - 23
    const dayEvents = filterEventsForDay(events, selectedDate);
    const slots = hours.map(hour => (<TimeSlot key={hour} date={hour} events={getEventsForHour(dayEvents, hour)} />));
    return <div className="day-view">{slots}</div>
}

// Only keeps events that start on the selected day
function filterEventsForDay(events, date) {
    return events.filter(event => isSameDay(new Date(event.start_time), date));
}

// Filters events to only those starting at a specific hour
function getEventsForHour(events, hour) {
    return events.filter(event => {
        const eventHour = new Date(event.start_time).getHours();
        return eventHour === hour;
    });
}