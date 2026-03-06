import { useRef, useLayoutEffect, useState } from 'react';
import { useTags } from '../../../context/TagContext';
import { isSameDay } from '../utils/dateUtils';
import { getEventTheme } from '../utils/eventStyleUtils';

export function HoverSummary({ events, date }) {
    if (!events || events.length === 0) return <EmptySummary />;
    return <EventList events={events} date={date} />;
}

function EmptySummary() {
    const style = { fontStyle: 'italic', color: '#9ca3af' };
    return (
        <div className="hover-summary">
            <div className="summary-event" style={style}>No events</div>
        </div>
    );
}

function EventList({ events, date }) {
    const ref = useRef(null);
    const style = useSmartPositioning(ref);
    const visibleEvents = events.slice(0, 5);
    const extraCount = events.length > 5 ? events.length - 5 : 0;

    return (
        <div className="hover-summary" ref={ref} style={style}>
            {visibleEvents.map(e => <SummaryItem key={e.id} event={e} date={date} />)}
            {extraCount > 0 && <MoreCount count={extraCount} />}
        </div>
    );
}

function useSmartPositioning(ref) {
    const [style, setStyle] = useState({});

    useLayoutEffect(() => {
        if (ref.current?.parentElement) {
            const rect = ref.current.parentElement.getBoundingClientRect();
            setStyle(calculateRelativeStyle(rect));
        }
    }, []);

    return style;
}

function calculateRelativeStyle(parentRect) {
    const WIDTH = 280, PADDING = 10, WIN_W = window.innerWidth;
    const centerX = parentRect.left + (parentRect.width / 2);

    // Clamp center based X to be within screen bounds
    let targetScreenX = centerX - (WIDTH / 2);
    targetScreenX = Math.max(PADDING, Math.min(targetScreenX, WIN_W - WIDTH - PADDING));

    // Convert to relative left offset
    return {
        left: `${targetScreenX - parentRect.left}px`,
        transform: 'none'
    };
}

function SummaryItem({ event, date }) {
    const tags = useTags();
    const theme = getEventTheme(event, tags);
    return (
        <div className="summary-event">
            <div className="event-dot" style={{ backgroundColor: theme.color }} />
            <span className="event-title">{event.title}</span>
            <span className="event-time">{getTimeString(event, date)}</span>
        </div>
    );
}

function MoreCount({ count }) {
    return (
        <div className="summary-event" style={{ color: '#6b7280', paddingLeft: '14px' }}>
            +{count} more events
        </div>
    );
}

function getTimeString(event, date) {
    if (isAllDay(event) || isInferredAllDay(event)) return 'All Day';
    if (isSameDay(new Date(event.start_time), date) && isSameDay(new Date(event.end_time), date)) {
        return formatTime(new Date(event.start_time));
    }
    if (isSameDay(new Date(event.start_time), date)) return formatTime(new Date(event.start_time));
    if (isSameDay(new Date(event.end_time), date)) return `Ends ${formatTime(new Date(event.end_time))}`;
    return 'All Day';
}

function formatTime(d) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
}

function isAllDay(event) {
    return event.all_day || event.is_all_day || event.allDay;
}

function isInferredAllDay(event) {
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    return start.getHours() === 0 && start.getMinutes() === 0 &&
        end.getHours() === 0 && end.getMinutes() === 0;
}
