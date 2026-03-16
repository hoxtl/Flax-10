/**
 * ListView - Calendar list view with grouped daily sections.
 * Supports pagination and auto-scroll to today.
 */
import { useMemo, useEffect, useRef } from 'react';
import { useCalendarData } from '../../../context/CalendarContext';
import { usePagination } from '../../../hooks/usePagination';
import { EventRow } from './EventRow';
import { Pagination, BackToTop } from '../../Pagination/Pagination';
import { getEffectiveTagName, sortByStartTime } from '../utils/eventUtils';
import styles from './ListView.module.css';

const PAGE_SIZE = 10;
const SCROLL_SELECTOR = '[data-list-view]';

function getDateKey(event) {
  return new Date(event.start_time).toISOString().split('T')[0];
}

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
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

function countDeadlines(events) {
  return events.filter((event) => getEffectiveTagName(event) === 'deadline').length;
}

function formatMonthYear(date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getInitialPage(events, viewMode) {
  if (!events.length || viewMode === 'day') return 1;
  const index = events.findIndex(e => getDateKey(e) === getTodayKey());
  return index === -1 ? 1 : Math.floor(index / PAGE_SIZE) + 1;
}

function useInitialPageForToday(viewMode, events, setPage) {
  const lastModeRef = useRef(null);
  useEffect(() => {
    if (viewMode === 'day' || !events.length) return;
    if (lastModeRef.current === viewMode) return;
    lastModeRef.current = viewMode;
    setPage(getInitialPage(events, viewMode));
  }, [viewMode, events, setPage]);
}

function useAutoScrollToToday(viewMode, currentPage, events) {
  useEffect(() => {
    if (viewMode === 'day' || !events.length) return;
    if (!events.some(e => getDateKey(e) === getTodayKey())) return;
    const container = document.querySelector(SCROLL_SELECTOR);
    const target = container?.querySelector(`[data-date-key="${getTodayKey()}"]`);
    target?.scrollIntoView({ block: 'start' });
  }, [viewMode, currentPage, events]);
}

function buildDayMeta(dateKey, events) {
  const date = new Date(dateKey);
  return { date, isToday: isSameDay(date, new Date()), eventCount: events.length, deadlines: countDeadlines(events) };
}

function DayBadges({ isToday, deadlines }) {
  if (!isToday && !deadlines) return null;
  const text = deadlines === 1 ? '1 deadline' : `${deadlines} deadlines`;
  return (
    <div className={styles.dayBadges}>
      {isToday && <span className={`${styles.dayBadge} ${styles.todayBadge}`}>Today</span>}
      {deadlines > 0 && <span className={`${styles.dayBadge} ${styles.deadlineBadge}`}>{text}</span>}
    </div>
  );
}

function HeaderMain({ meta, label }) {
  return (
    <div className={styles.dayMeta}>
      <div className={styles.dayName}>{meta.date.toLocaleDateString('en-US', { weekday: 'long' })}</div>
      <div className={styles.daySubRow}>
        <span>{label}</span>
        <DayBadges isToday={meta.isToday} deadlines={meta.deadlines} />
      </div>
    </div>
  );
}

function DayHeader({ dateKey, events }) {
  const meta = buildDayMeta(dateKey, events);
  const headerClass = meta.isToday ? `${styles.dayHeader} ${styles.dayHeaderToday}` : styles.dayHeader;
  const noun = meta.eventCount === 1 ? 'event' : 'events';
  return (
    <div className={headerClass}>
      <div className={styles.dayNumber}>{meta.date.getDate()}</div>
      <HeaderMain meta={meta} label={`${formatMonthYear(meta.date)} · ${meta.eventCount} ${noun}`} />
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

function useListViewState(propDate, propEvents) {
  const data = useCalendarData({ selectedDate: propDate, events: propEvents });
  const sortedEvents = useMemo(() => sortByStartTime(data.events || []), [data.events]);
  const pagination = usePagination(sortedEvents, PAGE_SIZE);
  useInitialPageForToday(data.viewMode, sortedEvents, pagination.setPage);
  useAutoScrollToToday(data.viewMode, pagination.currentPage, pagination.currentItems);
  return { ...data, sortedEvents, ...pagination };
}

/** Calendar list view showing grouped daily sections with expandable rows. */
export function ListView({ selectedDate: propDate, events: propEvents }) {
  const state = useListViewState(propDate, propEvents);
  if (!state.sortedEvents.length) return <EmptyState />;
  const body = state.viewMode !== 'day'
    ? <GroupedEventsList events={state.currentItems} />
    : <FlatEventsList events={state.currentItems} />;

  return (
    <div data-list-view className={styles.container}>
      <div className={styles.listCard}>{body}</div>
      <Pagination currentPage={state.currentPage} totalPages={state.totalPages} onPageChange={state.setPage} />
      <BackToTop containerSelector={SCROLL_SELECTOR} />
    </div>
  );
}
