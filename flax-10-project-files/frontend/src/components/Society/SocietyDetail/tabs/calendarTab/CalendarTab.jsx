import { useState } from "react";
import styles from "../tabs.module.css";
import { MonthView } from "../../../../Calendar/MonthView/MonthView";
import { DatePickerButton } from "../../../../Calendar/header/DatePickerButton";
import { addMonths, formatMonthYear } from "../../../../Calendar/utils/dateUtils";
import { expandRecurringEvents } from "../../../../Calendar/utils/recurrenceUtils";
import { CalendarProvider, useEventModal } from "../../../../../context/CalendarContext";
import { EventModal } from "../../../../Calendar/EventModal/EventModal";
import TagFilterBar from "../../tags/TagFilterBar";
import TagManager from "../../tags/TagManager";
import EventDetailPopup from "./EventDetailPopup";

export default function CalendarTab(props) {
    return (
        <CalendarProvider>
            <CalendarTabContent {...props} />
        </CalendarProvider>
    );
}

function CalendarTabContent({ events: rawEvents = [], editMode, eventHandlers, tags, tagHandlers, onViewAnnouncement }) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [tagFilters, setTagFilters] = useState([]);
    const [popupState, setPopupState] = useState({ event: null, rect: null });
    const expanded = expandRecurringEvents(rawEvents, selectedDate);
    const events = filterEvents(convertEvents(expanded, tags), tagFilters);

    const handleEventClick = (event, rect) => setPopupState({ event, rect });
    const closePopup = () => setPopupState({ event: null, rect: null });

    return (
        <div className={styles.calendarTab}>
            {editMode && <TagManager tags={tags} onAddTag={tagHandlers?.onAddTag} onDeleteTag={tagHandlers?.onDeleteTag} />}
            <CalendarHeader date={selectedDate} setDate={setSelectedDate} />
            <TagFilterBar tags={tags} activeFilters={tagFilters} onFilterChange={setTagFilters} />
            <MonthView selectedDate={selectedDate} events={events} onDateSelect={setSelectedDate}
                readOnly={!editMode} onEventClick={editMode ? null : handleEventClick} customTags={tags} />
            <SocietyEventModal eventHandlers={eventHandlers} tags={tags} editMode={editMode} />
            {popupState.event && <EventDetailPopup event={popupState.event} tags={tags} anchorRect={popupState.rect}
                onClose={closePopup} onViewAnnouncement={onViewAnnouncement} />}
        </div>
    );
}

function CalendarHeader({ date, setDate }) {
    return (
        <div className={styles.calendarHeader}>
            <NavButtons date={date} setDate={setDate} />
            <span className={styles.calendarTitle}>{formatMonthYear(date)}</span>
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

function SocietyEventModal({ eventHandlers, tags, editMode }) {
    const { isModalOpen, closeModal, modalEvent, modalInitialDate } = useEventModal();
    if (!isModalOpen || !editMode) return null;

    const handleSubmit = (data) => {
        const eventId = modalEvent?._baseId || modalEvent?.id;
        if (data._delete && eventId) {
            eventHandlers?.onDelete?.(eventId);
        } else if (eventId) {
            eventHandlers?.onUpdate?.(eventId, data);
        } else {
            eventHandlers?.onAdd?.(data);
        }
        closeModal();
    };

    return (
        <EventModal event={modalEvent} initialDate={modalInitialDate} onClose={closeModal}
            showReminder={false} customTags={tags} onSubmit={handleSubmit} />
    );
}

function convertEvents(events, tags) {
    return events.map(e => ({ ...e, tag_color: tags?.find(t => t.id === e.tag)?.color }));
}

function filterEvents(events, tagFilters) {
    if (!tagFilters || tagFilters.length === 0) return events;
    return events.filter(e => tagFilters.includes(e.tag));
}


