/**
 * EventsSummaryModal - Modal displaying filtered calendar events.
 * Provides date range filtering with today, week, and month options.
 */
import { useState, useEffect } from "react";
import GenericSummaryModal from "../../Common/GenericSummaryModal/GenericSummaryModal";
import SummaryItem from "../../Common/GenericSummaryModal/SummaryItem";
import { RANGE_OPTIONS, getRangeLabel, DATE_FORMAT, TIME_FORMAT, getFilteredEvents } from "../../../pages/Profile/utils/profileHelpers";

function formatEventMeta(ev) {
    const date = new Date(ev.start_time);
    const dateStr = date.toLocaleDateString('en-GB', DATE_FORMAT);
    const timeStr = date.toLocaleTimeString('en-GB', TIME_FORMAT);
    return `${dateStr} at ${timeStr} ${ev.location ? `• ${ev.location}` : ''}`;
}

function EventItem({ event, index }) {
    return <SummaryItem key={index} avatar="📅" title={event.title} subtitle={formatEventMeta(event)} />;
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
        <div style={{ display: 'flex', gap: '4px', padding: '6px', background: 'rgba(0,0,0,0.05)', borderRadius: '12px', justifyContent: 'space-between' }}>
            {RANGE_OPTIONS.map(([key, label]) => (
                <RangeButton key={key} isActive={range === key} label={label} onClick={() => onRangeChange(key)} />
            ))}
        </div>
    );
}

function RangeButton({ isActive, label, onClick }) {
    const style = {
        flex: 1, padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s ease',
        background: isActive ? '#8b6e4e' : 'transparent',
        color: isActive ? '#fff' : 'var(--text, #1f2937)',
        fontWeight: isActive ? '600' : '500',
    };
    return <button style={style} onClick={onClick}>{label}</button>;
}
