import { useState } from "react";
import styles from "./EventsSummaryModal.module.css";
import { RANGE_OPTIONS, getRangeLabel, DATE_FORMAT, TIME_FORMAT, getFilteredEvents } from "../../../pages/Profile/utils/profileHelpers";

export function EventsSummaryModal({ isOpen, onClose, allEvents, baseDate, isMutualOrSelf }) {
    const [range, setRange] = useState('today');
    if (!isOpen || !isMutualOrSelf) return null;

    const filteredEvents = getFilteredEvents(allEvents, range, baseDate);
    const title = `Events - ${getRangeLabel(range)} (${filteredEvents.length})`;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <Header title={title} onClose={onClose} />
                <div className={styles.modalContent}>
                    <RangeButtons range={range} onRangeChange={setRange} />
                    <EventsList events={filteredEvents} />
                </div>
            </div>
        </div>
    );
}

function Header({ title, onClose }) {
    return (
        <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>{title}</h2>
            <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
    );
}

function RangeButtons({ range, onRangeChange }) {
    return (
        <div className={styles.rangeSelector}>
            {RANGE_OPTIONS.map(([key, label]) => (
                <button
                    key={key}
                    className={range === key ? styles.rangeActive : ''}
                    onClick={() => onRangeChange(key)}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}

function EventsList({ events }) {
    if (events.length === 0) {
        return <p className={styles.emptyMessage}>No events found for this period</p>;
    }
    return events.map((event, i) => <EventItem key={i} event={event} />);
}

function EventItem({ event }) {
    return (
        <div className={styles.listItem}>
            <div className={styles.listAvatar}>📅</div>
            <div className={styles.listInfo}>
                <div className={styles.listName}>{event.title}</div>
                <EventMeta startTime={event.start_time} location={event.location} />
            </div>
        </div>
    );
}

function EventMeta({ startTime, location }) {
    const date = new Date(startTime);
    const dateStr = date.toLocaleDateString('en-GB', DATE_FORMAT);
    const timeStr = date.toLocaleTimeString('en-GB', TIME_FORMAT);
    return (
        <div className={styles.listMeta}>
            {dateStr} at {timeStr} {location ? `• ${location}` : ''}
        </div>
    );
}
