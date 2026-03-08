import { useState } from "react";
import styles from "../tabs.module.css";
import { MonthView } from "../../../../Calendar/MonthView/MonthView";
import { CalendarNav } from "../../../../Calendar/header/CalendarHeaderUtils";
import { addMonths, formatMonthYear, isSameMonth } from "../../../../Calendar/utils/dateUtils";
import { expandRecurringEvents } from "../../../../Calendar/utils/recurrenceUtils";
import { hasRecurrence, extractBaseEventId } from "../../../../Calendar/utils/eventUtils";
import { CalendarProvider, useEventModal } from "../../../../../context/CalendarContext";
import { EventModal } from "../../../../Calendar/EventModal/EventModal";
import TagFilterBar from "../../tags/TagFilterBar";
import TagManager from "../../tags/TagManager";
import { EventDetailPopup } from "../../../../Calendar/EventDetailPopup";
import SyncButton from "./SyncButton";
import { EventsSummaryModal } from "../../../../Calendar/EventsSummaryModal/EventsSummaryModal";
import { useConfirm } from "../../../../../context/ConfirmContext";

export default function CalendarTab(props) {
    return (
        <CalendarProvider>
            <CalendarTabContent {...props} />
        </CalendarProvider>
    );
}

function CalendarTabContent({ events: rawEvents = [], editMode, eventHandlers, tags, tagHandlers, onViewAnnouncement, societyId, isMember, onEditAnnouncement, announcements, societyName }) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [tagFilters, setTagFilters] = useState([]);
    const [popupState, setPopupState] = useState({ event: null, rect: null });
    const [summaryDate, setSummaryDate] = useState(null);
    const { openModal } = useEventModal();
    const confirmFn = useConfirm();
    const expanded = expandRecurringEvents(rawEvents, selectedDate);
    const events = filterEvents(convertEvents(expanded, tags), tagFilters);
    const closePopup = () => setPopupState({ event: null, rect: null });

    return (
        <div className={styles.calendarTab}>
            {editMode && <TagManager tags={tags} onAddTag={tagHandlers?.onAddTag} onDeleteTag={tagHandlers?.onDeleteTag} />}
            <CalendarHeader date={selectedDate} setDate={setSelectedDate} societyId={societyId} isMember={isMember} societyName={societyName} />
            <TagFilterBar tags={tags} activeFilters={tagFilters} onFilterChange={setTagFilters} />
            <MonthView selectedDate={selectedDate} events={events} onDateSelect={setSelectedDate}
                readOnly={!editMode}
                onEventClick={(e, r) => {
                    if (editMode) {
                        if (e.announcement && onEditAnnouncement) {
                            const announcement = announcements?.find(a => a.id === e.announcement);
                            if (announcement) onEditAnnouncement(announcement);
                        } else {
                            openModal(e, 'society', e.start_time);
                        }
                    } else {
                        setPopupState({ event: e, rect: r });
                    }
                }}
                onMoreClick={setSummaryDate}
                customTags={tags} />
            <SocietyEventModal eventHandlers={eventHandlers} tags={tags} editMode={editMode} />
            {popupState.event && <EventDetailPopup event={popupState.event} anchorRect={popupState.rect}
                tag={tags?.find(t => t.id === popupState.event.tag)} onClose={closePopup}
                actions={getPopupActions(popupState.event, onViewAnnouncement, editMode, {
                    onEdit: () => openModal(popupState.event, 'society', popupState.event.start_time),
                    onDelete: async (e) => await handlePopupDelete(e, eventHandlers, closePopup, confirmFn)
                })} />}
            <EventsSummaryModal
                isOpen={!!summaryDate}
                onClose={() => setSummaryDate(null)}
                allEvents={events}
                baseDate={summaryDate}
                isMutualOrSelf={true}
            />
        </div>
    );
}

async function handlePopupDelete(event, handlers, closePopup, confirmFn) {
    try {
        const isRecurring = hasRecurrence(event);
        let choice = true;
        if (isRecurring) {
            choice = await confirmFn({
                title: "Delete Recurring Society Event",
                message: "This is a recurring event. How would you like to delete it?",
                confirmText: "Delete ALL occurrences",
                alternateText: "Delete ONLY this one",
                cancelText: "Cancel",
                isDanger: true
            });
        } else {
            choice = await confirmFn({
                title: "Delete Society Event",
                message: `Are you sure you want to delete "${event.title}"?`,
                confirmText: "Delete",
                cancelText: "Cancel",
                isDanger: true
            });
        }

        const baseId = extractBaseEventId(event.id, event);
        if (choice === true) handlers?.onDelete?.(baseId, event.title);
        else if (choice === 'ALTERNATE') handlers?.onAddException?.(baseId, new Date(event.start_time).toISOString().slice(0, 10));
    } catch (err) {
        console.error('Deletion failed:', err);
    }
    closePopup();
}

function CalendarHeader({ date, setDate, societyId, isMember, societyName }) {
    const showToday = !isSameMonth(date, new Date());
    return (
        <div className={styles.calendarHeader}>
            <CalendarNav onPrev={() => setDate(addMonths(date, -1))} onNext={() => setDate(addMonths(date, 1))}
                onToday={() => setDate(new Date())} showToday={showToday} selectedDate={date}
                onDatePick={setDate} title={formatMonthYear(date)} />
            <div style={{ flex: 1 }} />
            {isMember && <SyncButton societyId={societyId} societyName={societyName} />}
        </div>
    );
}

function SocietyEventModal({ eventHandlers, tags, editMode }) {
    const { isModalOpen, closeModal, modalEvent, modalInitialDate } = useEventModal();
    const confirmFn = useConfirm();
    if (!isModalOpen || !editMode) return null;
    const handleDelete = async () => await handlePopupDelete(modalEvent, eventHandlers, closeModal, confirmFn);
    return (
        <EventModal event={modalEvent} initialDate={modalInitialDate} onClose={closeModal}
            showReminder={false} customTags={tags} onSubmit={(data) => handleModalSubmit(data, modalEvent, eventHandlers, closeModal)}
            onDelete={modalEvent?.id ? handleDelete : null} />
    );
}

function handleModalSubmit(data, modalEvent, eventHandlers, closeModal) {
    const eventId = modalEvent?._baseId || modalEvent?.id;
    if (eventId) eventHandlers?.onUpdate?.(eventId, data);
    else eventHandlers?.onAdd?.(data);
    closeModal();
}

function convertEvents(events, tags) {
    return events.map(e => ({ ...e, tag_color: tags?.find(t => t.id === e.tag)?.color }));
}

function filterEvents(events, tagFilters) {
    if (!tagFilters || tagFilters.length === 0) return events;
    return events.filter(e => tagFilters.includes(e.tag));
}

function getPopupActions(event, onViewAnnouncement, editMode, handlers) {
    const actions = [];
    if (editMode) {
        actions.push({ label: 'Edit', onClick: handlers.onEdit });
        actions.push({ label: 'Delete', variant: 'danger', onClick: () => handlers.onDelete(event) });
    }
    if (event?.announcement && onViewAnnouncement) {
        actions.push({ label: 'View Announcement', onClick: () => onViewAnnouncement(event.announcement) });
    } else if (event?.announcementId && onViewAnnouncement) {
        actions.push({ label: 'View Announcement', onClick: onViewAnnouncement });
    }
    return actions.length > 0 ? actions : null;
}

