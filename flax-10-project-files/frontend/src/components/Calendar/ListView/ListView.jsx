import { useCalendarData } from '../../../context/CalendarContext';
import { useEventGrouping } from '../hooks/useEventGrouping';
import { EventRow } from './EventRow';
import styles from './ListView.module.css';

function formatDateHeader(dateStr) {
    const date = new Date(dateStr);
    const opts = { weekday: 'long', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', opts);
}

function StickyDateHeader({ dateKey }) {
    return (
        <div className={styles.dateHeader}>
            <span className={styles.dateText}>{formatDateHeader(dateKey)}</span>
        </div>
    );
}

function DateGroup({ dateKey, events }) {
    return (
        <div className={styles.dateGroup}>
            <StickyDateHeader dateKey={dateKey} />
            <div className={styles.eventsList}>
                {events.map(event => <EventRow key={event.id} event={event} />)}
            </div>
        </div>
    );
}

function FlatEventsList({ events }) {
    return (
        <div className={styles.flatList}>
            {events.map(event => <EventRow key={event.id} event={event} />)}
        </div>
    );
}

function EmptyState() {
    return (
        <div className={styles.emptyState}>
            <p>No events to display</p>
        </div>
    );
}

export function ListView({ selectedDate: propDate, events: propEvents }) {
    const data = useCalendarData({ selectedDate: propDate, events: propEvents });
    const { viewMode } = data;
    const { groupedEvents, dateKeys, flatEvents } = useEventGrouping(data.events, viewMode);

    if (!data.events?.length) return <EmptyState />;

    if (viewMode === 'day' && flatEvents) {
        return <div className={styles.container}><FlatEventsList events={flatEvents} /></div>;
    }

    return (
        <div className={styles.container}>
            {dateKeys.map(key => (
                <DateGroup key={key} dateKey={key} events={groupedEvents.get(key)} />
            ))}
        </div>
    );
}
