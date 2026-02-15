import { useState } from "react";
import styles from "./tabs.module.css";
import { MonthView } from "../../../Calendar/MonthView/MonthView";
import { DatePickerButton } from "../../../Calendar/header/DatePickerButton";
import { addMonths } from "../../../../utils/dateUtils";

export default function CalendarTab({ details, editMode }) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const events = convertEvents(details.upcomingEvents || []);

    return (
        <div className={styles.calendarTab}>
            <CalendarHeader date={selectedDate} setDate={setSelectedDate} />
            <MonthView selectedDate={selectedDate} events={events} onDateSelect={setSelectedDate} readOnly={!editMode} />
        </div>
    );
}

function CalendarHeader({ date, setDate }) {
    return (
        <div className={styles.calendarHeader}>
            <NavButtons date={date} setDate={setDate} />
            <span className={styles.calendarTitle}>{formatTitle(date)}</span>
        </div>
    );
}

function NavButtons({ date, setDate }) {
    const nav = (dir) => setDate(addMonths(date, dir));
    return (
        <div className={styles.navButtons}>
            <button onClick={() => nav(-1)}>&larr;</button>
            <button onClick={() => setDate(new Date())}>Today</button>
            <button onClick={() => nav(1)}>&rarr;</button>
            <DatePickerButton selectedDate={date} onDatePick={setDate} />
        </div>
    );
}

function convertEvents(events) {
    return events.map(e => ({ ...e, start_time: `${e.date}T${e.time}`, end_time: `${e.date}T${addHour(e.time)}` }));
}

function addHour(time) {
    const [h, m] = time.split(":").map(Number);
    return `${String((h + 1) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatTitle(date) {
    return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}
