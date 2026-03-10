import { useMemo } from 'react';
import { useCalendarData } from '../../../context/CalendarContext';
import { usePagination } from '../../../hooks/usePagination';
import { EventRow } from './EventRow';
import { Pagination, BackToTop } from '../../Pagination/Pagination';
import styles from './ListView.module.css';

const PAGE_SIZE = 10;
const SCROLL_SELECTOR = '[data-list-view]';

function getDateKey(event) {
    return new Date(event.start_time).toISOString().split('T')[0];
}

function sortByStartTime(events) {
    return [...events].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
}

function groupEventsByDate(events) {
    const groups = new Map();
    events.forEach(event => {
        const key = getDateKey(event);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(event);
    });
    return { groups, keys: Array.from(groups.keys()).sort() };
}

function formatDateHeader(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
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

function GroupedEventsList({ events }) {
    const { groups, keys } = useMemo(() => groupEventsByDate(events), [events]);
    return keys.map(key => <DateGroup key={key} dateKey={key} events={groups.get(key)} />);
}

function FlatEventsList({ events }) {
    return (
        <div className={styles.flatList}>
            {events.map(event => <EventRow key={event.id} event={event} />)}
        </div>
    );
}

function EmptyState() {
    return <div className={styles.emptyState}><p>No events to display</p></div>;
}

export function ListView({ selectedDate: propDate, events: propEvents }) {
    const data = useCalendarData({ selectedDate: propDate, events: propEvents });
    const { viewMode } = data;
    const sortedEvents = useMemo(() => sortByStartTime(data.events || []), [data.events]);
    const { currentItems, totalPages, currentPage, setPage } = usePagination(sortedEvents, PAGE_SIZE);

    if (!sortedEvents.length) return <EmptyState />;

    const showGrouped = viewMode !== 'day';

    return (
        <div data-list-view className={styles.container}>
            {showGrouped ? <GroupedEventsList events={currentItems} /> : <FlatEventsList events={currentItems} />}
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
            <BackToTop containerSelector={SCROLL_SELECTOR} />
        </div>
    );
}
