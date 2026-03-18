import { useMemo, useEffect, useRef } from 'react';
import { useCalendarData } from '../../../context/CalendarContext';
import { usePagination } from '../../../hooks/usePagination';
import { EventRow, ConflictRow } from './EventRow';
import { isAllDay } from '../utils/eventUtils';
import { Pagination, BackToTop } from '../../Pagination/Pagination';
import { getEffectiveTagName, sortByStartTime } from '../utils/eventUtils';
import styles from './ListView.module.css';

const PAGE_SIZE = 10;
const SCROLL_SELECTOR = '[data-list-view]';

function getDateKey(event) {
    return new Date(event.start_time).toISOString().split('T')[0];
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

function isSameDay(a, b) {
    return (
        a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate()
    );
}

function countDeadlines(events) {
    return events.filter((event) => getEffectiveTagName(event) === 'deadline').length;
}

function formatMonthYear(date) {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getTodayKey() {
    return new Date().toISOString().split('T')[0];
}

function getInitialPage(events, viewMode) {
    if (!events.length || viewMode === 'day') return 1;
    const todayKey = getTodayKey();
    const index = events.findIndex(e => getDateKey(e) === todayKey);
    if (index === -1) return 1;
    return Math.floor(index / PAGE_SIZE) + 1;
}

function shouldScrollToToday(viewMode, events) {
    if (viewMode === 'day' || !events.length) return false;
    const todayKey = getTodayKey();
    return events.some(e => getDateKey(e) === todayKey);
}

function useInitialPageForToday(viewMode, events, setPage) {
    const lastModeRef = useRef(null);
    useEffect(() => {
        if (viewMode === 'day' || !events.length) return;
        const previous = lastModeRef.current;
        lastModeRef.current = viewMode;
        if (previous === viewMode) return;
        setPage(getInitialPage(events, viewMode));
    }, [viewMode, events, setPage]);
}

function useAutoScrollToToday(viewMode, currentPage, events) {
    useEffect(() => {
        if (!shouldScrollToToday(viewMode, events)) return;
        const container = document.querySelector(SCROLL_SELECTOR);
        if (!container) return;
        const selector = `[data-date-key="${getTodayKey()}"]`;
        const target = container.querySelector(selector);
        if (!target) return;
        target.scrollIntoView({ block: 'start' });
    }, [viewMode, currentPage, events]);
}

function buildDayMeta(dateKey, events) {
    const date = new Date(dateKey);
    const today = new Date();
    return {
        date,
        isToday: isSameDay(date, today),
        eventCount: events.length,
        deadlines: countDeadlines(events)
    };
}

function DayBadges({ isToday, deadlines }) {
    if (!isToday && !deadlines) return null;
    const deadlineText = deadlines === 1 ? '1 deadline' : `${deadlines} deadlines`;
    return (
        <div className={styles.dayBadges}>
            {isToday && (
                <span className={`${styles.dayBadge} ${styles.todayBadge}`}>Today</span>
            )}
            {deadlines > 0 && (
                <span className={`${styles.dayBadge} ${styles.deadlineBadge}`}>
                    {deadlineText}
                </span>
            )}
        </div>
    );
}

function DayHeader({ dateKey, events }) {
    const meta = buildDayMeta(dateKey, events);
    const headerClass = meta.isToday
        ? `${styles.dayHeader} ${styles.dayHeaderToday}`
        : styles.dayHeader;
    const noun = meta.eventCount === 1 ? 'event' : 'events';
    const label = `${formatMonthYear(meta.date)} · ${meta.eventCount} ${noun}`;
    return (
        <div className={headerClass}>
            <div className={styles.dayNumber}>{meta.date.getDate()}</div>
            <HeaderMain meta={meta} label={label} />
        </div>
    );
}

function HeaderMain({ meta, label }) {
    return (
        <div className={styles.dayMeta}>
            <div className={styles.dayName}>
                {meta.date.toLocaleDateString('en-US', { weekday: 'long' })}
            </div>
            <div className={styles.daySubRow}>
                <span>{label}</span>
                <DayBadges isToday={meta.isToday} deadlines={meta.deadlines} />
            </div>
        </div>
    );
}

function DateGroup({ dateKey, events }) {
    return (
        <section className={styles.dayGroup} data-date-key={dateKey}>
            <DayHeader dateKey={dateKey} events={events} />
            <div className={styles.eventsList}>
                {events.map(event => <EventRow key={event.id} event={event} />)}
            </div>
        </section>
    );
}

function GroupedEventsList({ events }) {
    const { groups, keys } = useMemo(() => groupEventsByDate(events), [events]);
    return keys.map(key => <DateGroup key={key} dateKey={key} events={groups.get(key)} />);
}

/**
 * Groups sorted events into buckets where overlapping timed events
 * are in the same bucket (to be shown side by side).
 * All-day events are always their own single-item bucket.
 */
function groupOverlappingEvents(events) {
    const result = [];
    let group = [];
    let maxEnd = null;

    for (const event of events) {
        if (isAllDay(event)) {
            if (group.length) { result.push(group); group = []; maxEnd = null; }
            result.push([event]);
            continue;
        }
        const start = new Date(event.start_time);
        const end = new Date(event.end_time);
        if (!maxEnd || start >= maxEnd) {
            if (group.length) result.push(group);
            group = [event];
            maxEnd = end;
        } else {
            group.push(event);
            if (end > maxEnd) maxEnd = end;
        }
    }
    if (group.length) result.push(group);
    return result;
}

function FlatEventsList({ events }) {
    const groups = useMemo(() => groupOverlappingEvents(events), [events]);
    return (
        <div className={styles.flatList}>
            {groups.map((group, i) =>
                group.length > 1
                    ? <ConflictRow key={i} events={group} />
                    : <EventRow key={group[0].id} event={group[0]} />
            )}
        </div>
    );
}

function EmptyState() {
    return <div className={styles.emptyState}><p>No events to display</p></div>;
}

function useListViewState(propDate, propEvents) {
    const data = useCalendarData({ selectedDate: propDate, events: propEvents });
    const sortedEvents = useMemo(
        () => sortByStartTime(data.events || []),
        [data.events]
    );
    const pagination = usePagination(sortedEvents, PAGE_SIZE);
    useInitialPageForToday(data.viewMode, sortedEvents, pagination.setPage);
    useAutoScrollToToday(data.viewMode, pagination.currentPage, pagination.currentItems);
    return { ...data, sortedEvents, ...pagination };
}

/**
 * Calendar list view showing grouped daily sections with expandable rows.
 */
export function ListView({ selectedDate: propDate, events: propEvents }) {
    const state = useListViewState(propDate, propEvents);
    if (!state.sortedEvents.length) return <EmptyState />;
    const isDay = state.viewMode === 'day';
    const items = isDay ? state.sortedEvents : state.currentItems;
    const body = isDay
        ? <FlatEventsList events={items} />
        : <GroupedEventsList events={items} />;
    return (
        <div data-list-view className={`${styles.container} ${isDay ? styles.dayMode : ''}`}>
            <div className={styles.listCard}>
                {body}
            </div>
            {!isDay && (
                <Pagination
                    currentPage={state.currentPage}
                    totalPages={state.totalPages}
                    onPageChange={state.setPage}
                />
            )}
            <BackToTop containerSelector={SCROLL_SELECTOR} />
        </div>
    );
}
