/*
 * Compact timeline widget for upcoming events.
 */
import { useMemo } from "react";
import { Clock, Calendar, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PrimaryButton from "../../../components/common/PrimaryButton/PrimaryButton";
import SharedWidgetHeader from "../../../components/common/WidgetHeader/WidgetHeader";
import styles from "./TinyTimelineWidget.module.css";
import { formatTime } from "../utils/dateFormatUtils";
import { isNow } from "../utils/eventUtils";

function getSafeNow(now) {
  return now instanceof Date && !Number.isNaN(now) ? now : new Date();
}

function getCurrentBlock(sortedEvents) {
  return sortedEvents.find(hasCurrentTiming) || null;
}

function hasCurrentTiming(event) {
  return event?.start_time && event?.end_time && isNow(event.start_time, event.end_time);
}

function getUpcomingEvents(sortedEvents, safeNow, row) {
  const upcomingLimit = row === 1 ? 1 : 5;
  return sortedEvents
    .filter((event) => isFutureEvent(event, safeNow))
    .sort(compareByStartTime)
    .slice(0, upcomingLimit);
}

function isFutureEvent(event, safeNow) {
  return event?.start_time && new Date(event.start_time).getTime() > safeNow.getTime();
}

function compareByStartTime(left, right) {
  return new Date(left.start_time) - new Date(right.start_time);
}

function getTimelineEvents(currentBlock, upcomingEvents) {
  return currentBlock ? [currentBlock, ...upcomingEvents] : upcomingEvents;
}

function getTypeLabel(event) {
  if (event.type) return event.type;
  return event.source === "task" ? "Task" : "Event";
}

function TinyTimelineHeader() {
  return <SharedWidgetHeader icon={Clock} title="Timeline" />;
}

function EmptyTimelineState() {
  return (
    <div className={styles.emptyState}>
      <Calendar size={24} strokeWidth={1} />
      <p>No events remaining today</p>
    </div>
  );
}

function TimelineList({ currentBlock, events }) {
  return (
    <div className={styles.timeline}>
      <div className={styles.spine} />
      {events.map((event, index) => (
        <TimelineEventRow
          key={event.id || index}
          event={event}
          index={index}
          isCurrent={event.id === currentBlock?.id}
        />
      ))}
    </div>
  );
}

function TimelineEventRow({ event, index, isCurrent }) {
  return (
    <motion.div
      className={styles.eventRow}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <TimelineMarker isCurrent={isCurrent} />
      <TimelineEventCard event={event} isCurrent={isCurrent} />
    </motion.div>
  );
}

function TimelineMarker({ isCurrent }) {
  return (
    <div className={`${styles.marker} ${isCurrent ? styles.markerNow : ""}`}>
      <div className={styles.dot} />
    </div>
  );
}

function TimelineEventCard({ event, isCurrent }) {
  return (
    <div className={`${styles.eventCard} ${isCurrent ? styles.cardNow : ""}`}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTime}>{formatTime(event.start_time)}</span>
        <span className={`${styles.cardBadge} ${isCurrent ? styles.badgeNow : ""}`}>
          {getTypeLabel(event)}
        </span>
      </div>
      <h4 className={styles.cardTitle}>{event.title}</h4>
      <TimelineLocation location={event.location} />
    </div>
  );
}

function TimelineLocation({ location }) {
  if (!location) return null;
  return (
    <div className={styles.cardLocation}>
      <MapPin size={12} className={styles.locationIcon} />
      <span>{location}</span>
    </div>
  );
}

function useTimelineData(now, sortedEvents, row) {
  const safeNow = getSafeNow(now);
  const currentBlock = useMemo(() => getCurrentBlock(sortedEvents), [sortedEvents]);
  const upcomingEvents = useMemo(() => getUpcomingEvents(sortedEvents, safeNow, row), [row, safeNow, sortedEvents]);
  return { currentBlock, timelineEvents: getTimelineEvents(currentBlock, upcomingEvents) };
}

export function TinyTimelineWidget({ now = new Date(), sortedEvents = [], row = 1 }) {
  const navigate = useNavigate();
  const { currentBlock, timelineEvents } = useTimelineData(now, sortedEvents, row);
  return (
    <div className={styles.root}>
      <TinyTimelineHeader />
      {timelineEvents.length ? <TimelineList currentBlock={currentBlock} events={timelineEvents} /> : <EmptyTimelineState />}
      <PrimaryButton type="button" size="small" pill className={styles.viewAll} onClick={() => navigate("/calendar")}>View my calendar</PrimaryButton>
    </div>
  );
}

export default TinyTimelineWidget;
