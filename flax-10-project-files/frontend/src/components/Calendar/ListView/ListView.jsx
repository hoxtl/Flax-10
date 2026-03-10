import { useCalendarData } from '../../../context/CalendarContext';
import { useEventGrouping } from '../hooks/useEventGrouping';
import { usePagination } from '../../../hooks/usePagination';
import { EventRow } from './EventRow';
import { Pagination, BackToTop } from '../../Pagination/Pagination';
import styles from './ListView.module.css';

const PAGE_SIZE = 7;
const SCROLL_CONTAINER = '[data-dashboard-main]';

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
    const { groupedEvents, dateKeys, flatEvents } = useEventGrouping(data.events, viewMode);

    const itemsToPage = viewMode === 'day' ? (flatEvents || []) : dateKeys;
    const { currentItems, totalPages, currentPage, setPage } = usePagination(itemsToPage, PAGE_SIZE);

    if (!data.events?.length) return <EmptyState />;

    if (viewMode === 'day' && flatEvents) {
        return (
            <div className={styles.container}>
                <FlatEventsList events={currentItems} />
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
                <BackToTop containerSelector={SCROLL_CONTAINER} />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {currentItems.map(key => (
                <DateGroup key={key} dateKey={key} events={groupedEvents.get(key)} />
            ))}
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
            <BackToTop containerSelector={SCROLL_CONTAINER} />
        </div>
    );
}
