import { calculateEventColumns } from '../utils/overlapUtils';

export function getHoursOfDay() {
    return Array.from({ length: 24 }, (_, i) => i);
}

export function formatHour(hour) {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
}

export function calculateEventStyle(event, slotHeight, allEvents, currentDate = null) {
    const { start, end } = getClippedEventRange(event, currentDate);
    const style = getBaseStyle(start, end, slotHeight);
    const layout = getLayout(event, allEvents);

    if (layout) return applyLayout(style, layout);
    return style;
}

function getClippedEventRange(event, currentDate) {
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    if (!currentDate) return { start, end };
    return clipToDay(start, end, currentDate);
}

function clipToDay(start, end, currentDate) {
    const { dayStart, dayEnd } = getDayBounds(currentDate);
    return {
        start: new Date(Math.max(start.getTime(), dayStart.getTime())),
        end: new Date(Math.min(end.getTime(), dayEnd.getTime()))
    };
}

function getDayBounds(date) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    return { dayStart, dayEnd };
}

function getBaseStyle(start, end, slotHeight) {
    const startMins = start.getHours() * 60 + start.getMinutes();
    const duration = Math.max((end - start) / (1000 * 60), 15);
    return {
        top: `${(startMins / 60) * slotHeight + 1}px`,
        height: `${(duration / 60) * slotHeight - 2}px`,
        width: '100%',
        left: '0',
        position: 'absolute'
    };
}

function getLayout(event, allEvents) {
    if (!allEvents || allEvents.length <= 1) return null;
    return calculateEventColumns(allEvents).get(event.id);
}

function applyLayout(style, layout) {
    if (layout.totalColumns <= 1) return style;
    const width = 100 / layout.totalColumns;
    return {
        ...style,
        width: `calc(${width}% - 6px)`,
        left: `${width * layout.column}%`
    };
}

export function calculateNewEndTime(event, deltaY, slotHeight, snapInterval) {
    const deltaMinutes = (deltaY / slotHeight) * 60;
    const snappedDelta = Math.round(deltaMinutes / snapInterval) * snapInterval;
    const currentEnd = new Date(event.end_time);

    const newEnd = new Date(currentEnd);
    newEnd.setMinutes(newEnd.getMinutes() + snappedDelta);

    const start = new Date(event.start_time);
    if (newEnd <= start) newEnd.setTime(start.getTime() + snapInterval * 60 * 1000);

    return newEnd;
}
