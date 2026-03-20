import { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { useCalendarData } from '../../../context/CalendarContext';
import { EventRow, ConflictRow } from './EventRow';
import { isAllDay } from '../utils/eventUtils';
import { Pagination, BackToTop } from '../../Pagination/Pagination';
import { getEffectiveTagName, sortByStartTime } from '../utils/eventUtils';
import styles from './ListView.module.css';

const DAYS_PER_PAGE = 5;
const SCROLL_SELECTOR = '[data-list-view]';

function getDateKey(event) {
  return new Date(event.start_time).toISOString().split('T')[0];
}

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
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

function getInitialDayPage(dateKeys) {
  if (!dateKeys.length) return 1;
  const todayKey = getTodayKey();
  const dayIndex = dateKeys.indexOf(todayKey);
  return dayIndex === -1 ? 1 : Math.floor(dayIndex / DAYS_PER_PAGE) + 1;
}

function useInitialPageForToday(viewMode, dateKeys, setPage) {
  const lastModeRef = useRef(null);
  useEffect(() => {
    if (viewMode === 'day' || viewMode === 'week' || !dateKeys.length) return;
    if (lastModeRef.current === viewMode) return;
    lastModeRef.current = viewMode;
    setPage(getInitialDayPage(dateKeys));
  }, [viewMode, dateKeys, setPage]);
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

function DayHeader({ dateKey, events }) {
  const date = new Date(dateKey);
  const isToday = dateKey === getTodayKey();
  const deadlines = countDeadlines(events);
  const noun = events.length === 1 ? 'event' : 'events';
  const label = `${formatMonthYear(date)} · ${events.length} ${noun}`;

  return (
    <div className={isToday ? `${styles.dayHeader} ${styles.dayHeaderToday}` : styles.dayHeader}>
      <div className={styles.dayNumber}>{date.getDate()}</div>
      <div className={styles.dayMeta}>
        <div className={styles.dayName}>{date.toLocaleDateString('en-US', { weekday: 'long' })}</div>
        <div className={styles.daySubRow}>
          <span>{label}</span>
          <DayBadges isToday={isToday} deadlines={deadlines} />
        </div>
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
    const start = new Date(event.start_time), end = new Date(event.end_time);
    if (!maxEnd || start >= maxEnd) {
      if (group.length) result.push(group);
      group = [event]; maxEnd = end;
    } else {
      group.push(event); if (end > maxEnd) maxEnd = end;
    }
  }
  if (group.length) result.push(group);
  return result;
}

function FlatEventsList({ events }) {
  const groups = useMemo(() => groupOverlappingEvents(events), [events]);
  return (
    <div className={styles.flatList}>
      {groups.map((group, i) => group.length > 1 ? <ConflictRow key={i} events={group} /> : <EventRow key={group[0].id} event={group[0]} />)}
    </div>
  );
}

function EmptyState() {
  return <div className={styles.emptyState}><p>No events to display</p></div>;
}

function useDayPagination(sortedEvents, daysPerPage) {
  const [currentPage, setPageInternal] = useState(1);
  const { groups, keys } = useMemo(() => groupEventsByDate(sortedEvents), [sortedEvents]);
  const totalPages = Math.max(1, Math.ceil(keys.length / daysPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const currentItems = useMemo(() => {
    const startDay = (safePage - 1) * daysPerPage;
    return keys.slice(startDay, startDay + daysPerPage).flatMap(key => groups.get(key));
  }, [groups, keys, safePage, daysPerPage]);
  const setPage = useCallback((page) => setPageInternal(Math.max(1, Math.min(page, totalPages))), [totalPages]);
  return { currentItems, totalPages, currentPage: safePage, setPage, dateKeys: keys };
}

function useListViewState(propDate, propEvents) {
  const data = useCalendarData({ selectedDate: propDate, events: propEvents });
  const sortedEvents = useMemo(() => sortByStartTime(data.events || []), [data.events]);
  const pagination = useDayPagination(sortedEvents, DAYS_PER_PAGE);
  useInitialPageForToday(data.viewMode, pagination.dateKeys, pagination.setPage);
  useAutoScrollToToday(data.viewMode, pagination.currentPage, pagination.currentItems);
  return { ...data, sortedEvents, ...pagination };
}

/** Calendar list view showing grouped daily sections. */
export function ListView({ selectedDate: propDate, events: propEvents }) {
  const state = useListViewState(propDate, propEvents);
  if (!state.sortedEvents.length) return <EmptyState />;
  const showAll = state.viewMode === 'day' || state.viewMode === 'week';
  const items = showAll ? state.sortedEvents : state.currentItems;
  const body = state.viewMode === 'day' ? <FlatEventsList events={items} /> : <GroupedEventsList events={items} />;

  return (
    <div data-list-view className={styles.container}>
      <div className={styles.listCard}>{body}</div>
      {!showAll && <Pagination currentPage={state.currentPage} totalPages={state.totalPages} onPageChange={state.setPage} />}
      {!showAll && <BackToTop containerSelector={SCROLL_SELECTOR} />}
    </div>
  );
}

