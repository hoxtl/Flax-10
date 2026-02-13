import { useState } from "react";
import styles from "./tabs.module.css";

export default function CalendarTab({ details }) {
    const [view, setView] = useState("month");
    const events = details.upcomingEvents || [];

    return (
        <div className={styles.calendarTab}>
            <ViewSwitcher view={view} onViewChange={setView} />
            <CalendarPlaceholder view={view} events={events} />
        </div>
    );
}

function ViewSwitcher({ view, onViewChange }) {
    const views = ["month", "week", "day"];
    return (
        <div className={styles.viewSwitcher}>
            {views.map(v => <ViewButton key={v} view={v} isActive={view === v} onClick={() => onViewChange(v)} />)}
        </div>
    );
}

function ViewButton({ view, isActive, onClick }) {
    const className = isActive ? `${styles.viewBtn} ${styles.activeView}` : styles.viewBtn;
    return <button className={className} onClick={onClick}>{capitalize(view)}</button>;
}

function CalendarPlaceholder({ view, events }) {
    return (
        <div className={styles.calendarPlaceholder}>
            <p>Society calendar ({view} view)</p>
            <EventsList events={events} />
        </div>
    );
}

function EventsList({ events }) {
    if (events.length === 0) return <p className={styles.empty}>No upcoming events.</p>;
    return (
        <ul className={styles.eventsList}>
            {events.map(e => <li key={e.id}>{e.title} - {e.date} at {e.time}</li>)}
        </ul>
    );
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
