/**
 * EventsSummaryModal - Modal displaying filtered calendar events.
 * Provides date range filtering with today, week, and month options.
 */

import { useState, useEffect } from "react";
import GenericSummaryModal from "../../common/GenericSummaryModal/GenericSummaryModal";
import SummaryItem from "../../common/GenericSummaryModal/SummaryItem";
import { RANGE_OPTIONS, getRangeLabel, DATE_FORMAT, TIME_FORMAT, getFilteredEvents } from "../../../pages/Profile/utils/profileHelpers";
import LocationLink from "../../common/LocationLink/LocationLink";
import styles from "./EventsSummaryModal.module.css";

function EventMeta({ event }) {
    const date = new Date(event.start_time);
    const dateStr = date.toLocaleDateString('en-GB', DATE_FORMAT);
    const timeStr = date.toLocaleTimeString('en-GB', TIME_FORMAT);
    return (
        <span className={styles.eventMeta}>
            <span>{`${dateStr} at ${timeStr}`}</span>
            {event.location && (
                <>
                    <span className={styles.metaDivider}>•</span>
                    <LocationLink location={event.location} className={styles.locationLink} textClassName={styles.locationText} />
                </>
            )}
        </span>
    );
}

function EventItem({ event, index }) {
    return <SummaryItem key={index} avatar="📅" title={event.title} subtitle={<EventMeta event={event} />} />;
}

function useEventsSummaryState(isOpen) {
    const [range, setRange] = useState('today');
    useEffect(() => { if (isOpen) setRange('today'); }, [isOpen]);
    return { range, setRange };
}

/** Modal for viewing events with date range filtering. */

export function EventsSummaryModal({ isOpen, onClose, allEvents, baseDate, isMutualOrSelf }) {
    const { range, setRange } = useEventsSummaryState(isOpen);
    if (!isOpen || !isMutualOrSelf) return null;

    const filteredEvents = getFilteredEvents(allEvents, range, baseDate);
    const title = `Events - ${getRangeLabel(range)} (${filteredEvents.length})`;

    return (
        <GenericSummaryModal isOpen={isOpen} onClose={onClose} title={title}
            emptyMessage="No events found for this period"
            topContent={<RangeButtons range={range} onRangeChange={setRange} />}
            items={filteredEvents} renderItem={(event, i) => <EventItem event={event} index={i} />} />
    );
}

function RangeButtons({ range, onRangeChange }) {
    return (
        <div className={styles.rangeBar}>
            {RANGE_OPTIONS.map(([key, label]) => (
                <RangeButton key={key} isActive={range === key} label={label} onClick={() => onRangeChange(key)} />
            ))}
        </div>
    );
}

function RangeButton({ isActive, label, onClick }) {
    return <button className={`${styles.rangeBtn}${isActive ? ` ${styles.active}` : ''}`} onClick={onClick}>{label}</button>;
}
