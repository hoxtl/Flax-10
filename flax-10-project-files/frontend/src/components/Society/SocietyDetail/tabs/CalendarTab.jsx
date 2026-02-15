import { useState } from "react";
import styles from "./tabs.module.css";
import { MonthView } from "../../../Calendar/MonthView/MonthView";
import { DatePickerButton } from "../../../Calendar/header/DatePickerButton";
import { addMonths } from "../../../../utils/dateUtils";
import { CalendarProvider, useEventModal } from "../../../../context/CalendarContext";
import { EventModal } from "../../../Calendar/EventModal/EventModal";
import TagFilterBar from "../TagFilterBar";
import TagManager from "../TagManager";
import EventDetailPopup from "../EventDetailPopup";

export default function CalendarTab(props) {
    return (
        <CalendarProvider>
            <CalendarTabContent {...props} />
        </CalendarProvider>
    );
}

function CalendarTabContent({ details, editMode, onUpdate, tags, onViewAnnouncement }) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [tagFilters, setTagFilters] = useState([]);
    const [popupState, setPopupState] = useState({ event: null, rect: null });
    const events = filterEvents(convertEvents(details.upcomingEvents || [], tags), tagFilters);

    const handleEventClick = (event, rect) => setPopupState({ event, rect });
    const closePopup = () => setPopupState({ event: null, rect: null });

    return (
        <div className={styles.calendarTab}>
            {editMode && <TagManager tags={tags} onUpdate={(t) => onUpdate?.({ tags: t })} />}
            <CalendarHeader date={selectedDate} setDate={setSelectedDate} />
            <TagFilterBar tags={tags} activeFilters={tagFilters} onFilterChange={setTagFilters} />
            <MonthView selectedDate={selectedDate} events={events} onDateSelect={setSelectedDate}
                readOnly={!editMode} onEventClick={editMode ? null : handleEventClick} customTags={tags} />
            <SocietyEventModal onUpdate={onUpdate} events={details.upcomingEvents || []} tags={tags} editMode={editMode} />
            {popupState.event && <EventDetailPopup event={popupState.event} tags={tags} anchorRect={popupState.rect}
                onClose={closePopup} onViewAnnouncement={onViewAnnouncement} />}
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

function SocietyEventModal({ onUpdate, events, tags, editMode }) {
    const { isModalOpen, closeModal, modalEvent, modalInitialDate } = useEventModal();
    if (!isModalOpen || !editMode) return null;

    const handleSubmit = (data) => {
        const newEvent = createEventFromForm(data, modalEvent);
        const updated = modalEvent?.id ? events.map(e => e.id === modalEvent.id ? newEvent : e) : [...events, newEvent];
        onUpdate?.({ upcomingEvents: updated });
        closeModal();
    };

    return (
        <EventModal event={modalEvent} initialDate={modalInitialDate} onClose={closeModal}
            showReminder={false} customTags={tags} onSubmit={handleSubmit} />
    );
}

function createEventFromForm(data, existingEvent) {
    return { id: existingEvent?.id || Date.now(), title: data.title, date: data.date, time: data.time || "12:00",
        endTime: data.endTime, tagId: data.tag, location: data.location, description: data.description };
}

function convertEvents(events, tags) {
    return events.map(e => ({ ...e, start_time: `${e.date}T${e.time}`, end_time: `${e.date}T${addHour(e.time)}`,
        tag_color: tags?.find(t => t.id === e.tagId)?.color }));
}

function filterEvents(events, tagFilters) {
    if (!tagFilters || tagFilters.length === 0) return events;
    return events.filter(e => tagFilters.includes(e.tagId));
}

function addHour(time) {
    const [h, m] = time.split(":").map(Number);
    return `${String((h + 1) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatTitle(date) {
    return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}
