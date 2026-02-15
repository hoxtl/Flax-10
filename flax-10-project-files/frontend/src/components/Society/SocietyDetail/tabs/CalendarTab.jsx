import { useState } from "react";
import styles from "./tabs.module.css";
import { MonthView } from "../../../Calendar/MonthView/MonthView";
import { WeekView } from "../../../Calendar/WeekView/WeekView";
import { DayView } from "../../../Calendar/DayView/DayView";

export default function CalendarTab({ details, editMode }) {
    const [view, setView] = useState("month");
    const [selectedDate, setSelectedDate] = useState(new Date());
    const events = convertEvents(details.upcomingEvents || []);

    return (
        <div className={styles.calendarTab}>
            <CalendarHeader view={view} setView={setView} date={selectedDate} setDate={setSelectedDate} />
            <CalendarView view={view} date={selectedDate} events={events} onDateSelect={setSelectedDate} readOnly={!editMode} />
        </div>
    );
}

function CalendarHeader({ view, setView, date, setDate }) {
    return (
        <div className={styles.calendarHeader}>
            <NavButtons date={date} setDate={setDate} view={view} />
            <span className={styles.calendarTitle}>{formatTitle(date, view)}</span>
            <ViewSwitcher view={view} setView={setView} />
        </div>
    );
}

function NavButtons({ date, setDate, view }) {
    const nav = (dir) => setDate(getNewDate(date, view, dir));
    return (
        <div className={styles.navButtons}>
            <button onClick={() => nav(-1)}>&larr;</button>
            <button onClick={() => setDate(new Date())}>Today</button>
            <button onClick={() => nav(1)}>&rarr;</button>
        </div>
    );
}

function ViewSwitcher({ view, setView }) {
    const views = ["month", "week", "day"];
    return (
        <div className={styles.viewSwitcher}>
            {views.map(v => <ViewBtn key={v} v={v} active={view === v} onClick={() => setView(v)} />)}
        </div>
    );
}

function ViewBtn({ v, active, onClick }) {
    const cls = active ? `${styles.viewBtn} ${styles.activeView}` : styles.viewBtn;
    return <button className={cls} onClick={onClick}>{v.charAt(0).toUpperCase() + v.slice(1)}</button>;
}

function CalendarView({ view, date, events, onDateSelect, readOnly }) {
    if (view === "week") return <WeekView selectedDate={date} events={events} onDateSelect={onDateSelect} readOnly={readOnly} />;
    if (view === "day") return <DayView selectedDate={date} events={events} readOnly={readOnly} />;
    return <MonthView selectedDate={date} events={events} onDateSelect={onDateSelect} readOnly={readOnly} />;
}

function convertEvents(events) {
    return events.map(e => ({ ...e, start_time: `${e.date}T${e.time}`, end_time: `${e.date}T${addHour(e.time)}` }));
}

function addHour(time) {
    const [h, m] = time.split(":").map(Number);
    return `${String((h + 1) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function getNewDate(date, view, dir) {
    const d = new Date(date);
    if (view === "month") d.setMonth(d.getMonth() + dir);
    else if (view === "week") d.setDate(d.getDate() + 7 * dir);
    else d.setDate(d.getDate() + dir);
    return d;
}

function formatTitle(date, view) {
    if (view === "day") return date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
    return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}
