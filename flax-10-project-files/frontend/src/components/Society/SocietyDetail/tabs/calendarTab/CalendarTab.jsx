/**
 * CalendarTab integrates the society's specific events into a MonthView,
 * allowing members to view and admins to manage scheduled social activities.
 */
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
import { EventPopover } from "../../../../Calendar/EventPopover/EventPopover";
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

/** Inner content that utilizes the CalendarProvider context. */
function CalendarTabContent(props) {
    const { events: raw, editMode, tags, societyId, isMember, societyName } = props;
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [tagFilters, setTagFilters] = useState([]);
    const [popup, setPopup] = useState({ event: null, rect: null });
    const [summaryDate, setSummaryDate] = useState(null);

    const events = filterEvents(convertEvents(expandRecurringEvents(raw, selectedDate), tags), tagFilters);

    return (
        <div className={styles.calendarTab}>
            <CalendarControls props={props} selectedDate={selectedDate} setSelectedDate={setSelectedDate}
                tagFilters={tagFilters} setTagFilters={setTagFilters} />
            <CalendarView props={props} events={events} selectedDate={selectedDate}
                setSelectedDate={setSelectedDate} setPopup={setPopup} setSummaryDate={setSummaryDate} />
            <SocietyEventModal eventHandlers={props.eventHandlers} tags={tags} editMode={editMode} />
            <CalendarPopovers popup={popup} setPopup={setPopup} props={props} events={events} summaryDate={summaryDate}
                setSummaryDate={setSummaryDate} />
        </div>
    );
}

function CalendarControls({ props, selectedDate, setSelectedDate, tagFilters, setTagFilters }) {
    const { editMode, tags, tagHandlers, societyId, isMember, societyName } = props;
    return (
        <>
            {editMode && <TagManager tags={tags} onAddTag={tagHandlers?.onAddTag} onDeleteTag={tagHandlers?.onDeleteTag} />}
            <CalendarHeader date={selectedDate} setDate={setSelectedDate} societyId={societyId} isMember={isMember} societyName={societyName} />
            <TagFilterBar tags={tags} activeFilters={tagFilters} onFilterChange={setTagFilters} />
        </>
    );
}

function CalendarView({ props, events, selectedDate, setSelectedDate, setPopup, setSummaryDate }) {
    const { editMode, onEditAnnouncement, announcements } = props;
    const { openModal } = useEventModal();
    const handleEvent = (e, r) => {
        if (!editMode) return setPopup({ event: e, rect: r });
        if (e.announcement && onEditAnnouncement) {
            const ann = announcements?.find(a => a.id === e.announcement);
            if (ann) return onEditAnnouncement(ann);
        }
        openModal(e, 'society', e.start_time);
    };

    return <MonthView selectedDate={selectedDate} events={events} onDateSelect={setSelectedDate}
        readOnly={!editMode} onEventClick={handleEvent} onMoreClick={setSummaryDate} customTags={props.tags} />;
}

function handleEventDeletion(handlers, close, confirmFn) {
    return async (event) => {
        try {
            const choice = await confirmDeletion(event, confirmFn);
            if (choice === null) return;
            const baseId = extractBaseEventId(event.id, event);
            if (choice === true) handlers?.onDelete?.(baseId, event.title);
            else if (choice === 'ALTERNATE') {
                handlers?.onAddException?.(baseId, new Date(event.start_time).toISOString().slice(0, 10));
            }
        } catch (err) { console.error('Deletion failed:', err); }
        close();
    };
}

function CalendarPopovers({ popup, setPopup, props, events, summaryDate, setSummaryDate }) {
    const { tags, onViewAnnouncement, editMode, eventHandlers } = props;
    const { openModal } = useEventModal();
    const close = () => setPopup({ event: null, rect: null });
    const onDelete = handleEventDeletion(eventHandlers, close, useConfirm());
    const onEdit = () => openModal(popup.event, 'society', popup.event.start_time);
    const acts = popup.event ? getPopupActions(popup.event, onViewAnnouncement, editMode, { onEdit, onDelete }) : null;

    return (
        <>
            {popup.event && <EventPopover event={popup.event} anchorRect={popup.rect} tags={tags}
                onClose={close} readOnly={!editMode} actions={acts} />}
            <EventsSummaryModal isOpen={!!summaryDate} onClose={() => setSummaryDate(null)}
                allEvents={events} baseDate={summaryDate} isMutualOrSelf={true} />
        </>
    );
}

async function confirmDeletion(event, confirmFn) {
    const isRecurring = hasRecurrence(event);
    if (!isRecurring) return await confirmFn({
        title: "Delete Event", message: `Delete "${event.title}"?`,
        confirmText: "Delete", cancelText: "Cancel", isDanger: true
    });
    return await confirmFn({
        title: "Delete Recurring Event",
        message: "Delete this occurrence or all?",
        confirmText: "All", alternateText: "Just this one",
        cancelText: "Cancel", isDanger: true
    });
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
    const onDelete = handleEventDeletion(eventHandlers, closeModal, confirmFn);
    return (
        <EventModal event={modalEvent} initialDate={modalInitialDate} onClose={closeModal}
            showReminder={false} customTags={tags} onSubmit={(data) => handleModalSubmit(data, modalEvent, eventHandlers, closeModal)}
            onDelete={modalEvent?.id ? () => onDelete(modalEvent) : null} />
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

