import { useState } from "react";
import styles from "./tabs.module.css";
import { MonthView } from "../../../Calendar/MonthView/MonthView";
import { DatePickerButton } from "../../../Calendar/header/DatePickerButton";
import { addMonths } from "../../../../utils/dateUtils";
import { CalendarProvider, useEventModal } from "../../../../context/CalendarContext";
import { EventModal } from "../../../Calendar/EventModal/EventModal";

export default function CalendarTab(props) {
    return (
        <CalendarProvider>
            <CalendarTabContent {...props} />
        </CalendarProvider>
    );
}

function CalendarTabContent({ details, editMode, onUpdate, tags }) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const events = convertEvents(details.upcomingEvents || []);
    return (
        <div className={styles.calendarTab}>
            <CalendarHeader date={selectedDate} setDate={setSelectedDate} />
            <MonthView selectedDate={selectedDate} events={events} onDateSelect={setSelectedDate} readOnly={!editMode} />
            <SocietyEventModal onUpdate={onUpdate} events={details.upcomingEvents || []} tags={tags} />
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

function SocietyEventModal({ onUpdate, events, tags }) {
    const { isModalOpen, closeModal, modalEvent, modalType, modalInitialDate } = useEventModal();
    if (!isModalOpen) return null;

    const handleSubmit = (data) => {
        const newEvent = { ...data, id: Date.now() };
        onUpdate?.({ upcomingEvents: [...events, newEvent] });
        closeModal();
    };

    return (
        <EventModal event={modalEvent} initialType={modalType} initialDate={modalInitialDate}
            onClose={closeModal} showReminder={false} customTags={tags} onSubmit={handleSubmit} />
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
