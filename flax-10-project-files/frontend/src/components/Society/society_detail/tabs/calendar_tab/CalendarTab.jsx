/*
 * CalendarTab adapts the shared calendar UI for a society detail page.
 */

import { useState } from "react";
import styles from "../Tabs.module.css";
import { MonthView } from "../../../../Calendar/month_view/MonthView";
import { CalendarNav } from "../../../../Calendar/header/CalendarHeaderUtils";
import { addMonths, formatMonthYear, isSameMonth } from "../../../../Calendar/utils/dateUtils";
import { expandRecurringEvents } from "../../../../Calendar/utils/recurrenceUtils";
import { hasRecurrence, extractBaseEventId } from "../../../../Calendar/utils/eventUtils";
import { CalendarProvider, useEventModal } from "../../../../../context/CalendarContext";
import { EventModal } from "../../../../Calendar/event_modal/EventModal";
import TagFilterBar from "../../Tags/TagFilterBar";
import TagManager from "../../Tags/TagManager";
import { EventPopover } from "../../../../Calendar/event_popover/EventPopover";
import SyncButton from "./SyncButton";
import { EventsSummaryModal } from "../../../../Calendar/events_summary_modal/EventsSummaryModal";
import { useConfirm } from "../../../../../context/ConfirmContext";

const confirmNonRecurringDeletion = (event, confirmFn) =>
    confirmFn({
        title: "Delete Event", message: `Delete "${event.title}"?`,
        confirmText: "Delete", cancelText: "Cancel", isDanger: true
    });

const confirmRecurringDeletion = (confirmFn) =>
    confirmFn({
        title: "Delete Recurring Event", message: "Delete this occurrence or all?",
        confirmText: "All", alternateText: "Just this one", cancelText: "Cancel", isDanger: true
    });

async function confirmDeletion(event, confirmFn) {
    if (!hasRecurrence(event)) return confirmNonRecurringDeletion(event, confirmFn);
    return confirmRecurringDeletion(confirmFn);
}

const executeDeleteChoice = (choice, event, handlers) => {
    const baseId = extractBaseEventId(event.id, event);
    if (choice === true) handlers?.onDelete?.(baseId, event.title);
    if (choice === 'ALTERNATE')
        handlers?.onAddException?.(baseId, new Date(event.start_time).toISOString().slice(0, 10));
};

const executeWithConfirm = async (event, handlers, confirmFn) => {
    const choice = await confirmDeletion(event, confirmFn);
    if (choice !== null) executeDeleteChoice(choice, event, handlers);
};

function handleEventDeletion(handlers, close, confirmFn) {
    return async (event) => {
        try { await executeWithConfirm(event, handlers, confirmFn); }
        catch (err) {}
        close();
    };
}

function handleModalSubmit(data, modalEvent, eventHandlers, closeModal) {
    const eventId = modalEvent?._baseId || modalEvent?.id;
    if (eventId) eventHandlers?.onUpdate?.(eventId, data);
    else eventHandlers?.onAdd?.(data);
    closeModal();
}

const convertEvents = (events, tags) =>
    events.map(e => ({ ...e, tag_color: tags?.find(t => t.id === e.tag)?.color }));

const filterEvents = (events, tagFilters) =>
    (!tagFilters?.length) ? events : events.filter(e => tagFilters.includes(e.tag));

const getEditActions = (event, handlers) => [
    { label: 'Edit', onClick: handlers.onEdit },
    { label: 'Delete', variant: 'danger', onClick: () => handlers.onDelete(event) }
];

const getAnnouncementAction = (event, onViewAnnouncement) => {
    if (event?.announcement && onViewAnnouncement)
        return { label: 'View Announcement', onClick: () => onViewAnnouncement(event.announcement) };
    if (event?.announcementId && onViewAnnouncement)
        return { label: 'View Announcement', onClick: onViewAnnouncement };
    return null;
};

function getPopupActions(event, onViewAnnouncement, editMode, handlers) {
    const actions = editMode ? getEditActions(event, handlers) : [];
    const annAction = getAnnouncementAction(event, onViewAnnouncement);
    if (annAction) actions.push(annAction);
    return actions.length > 0 ? actions : null;
}

const getAnnouncementForEvent = (event, announcements) =>
    announcements?.find(a => a.id === event.announcement);

const prepareEvents = (raw, tags, selectedDate, tagFilters) =>
    filterEvents(convertEvents(expandRecurringEvents(raw, selectedDate), tags), tagFilters);

export default function CalendarTab(props) {
    return <CalendarProvider><CalendarTabContent {...props} /></CalendarProvider>;
}

function CalendarTabContent(props) {
    const { events: raw, tags, editMode } = props;
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [tagFilters, setTagFilters] = useState([]);
    const [popup, setPopup] = useState({ event: null, rect: null });
    const [summaryDate, setSummaryDate] = useState(null);
    const events = prepareEvents(raw, tags, selectedDate, tagFilters);
    return (
        <div className={styles.calendarTab}>
            <CalendarControls props={props} selectedDate={selectedDate} setSelectedDate={setSelectedDate}
                tagFilters={tagFilters} setTagFilters={setTagFilters} />
            <CalendarView props={props} events={events} selectedDate={selectedDate}
                setSelectedDate={setSelectedDate} setPopup={setPopup} setSummaryDate={setSummaryDate} />
            <SocietyEventModal eventHandlers={props.eventHandlers} tags={tags} editMode={editMode} />
            <CalendarPopovers popup={popup} setPopup={setPopup} props={props} events={events}
                summaryDate={summaryDate} setSummaryDate={setSummaryDate} />
        </div>
    );
}

function CalendarControls({ props, selectedDate, setSelectedDate, tagFilters, setTagFilters }) {
    const { editMode, tags, tagHandlers, societyId, isMember, societyName } = props;
    return (
        <>
            {editMode && <TagManager tags={tags} onAddTag={tagHandlers?.onAddTag} onDeleteTag={tagHandlers?.onDeleteTag} />}
            <CalendarHeader date={selectedDate} setDate={setSelectedDate} societyId={societyId}
                isMember={isMember} societyName={societyName} />
            <TagFilterBar tags={tags} activeFilters={tagFilters} onFilterChange={setTagFilters} />
        </>
    );
}

function CalendarView({ props, events, selectedDate, setSelectedDate, setPopup, setSummaryDate }) {
    const { editMode, onEditAnnouncement, announcements, tags } = props;
    const { openModal } = useEventModal();
    const handleAnnouncementClick = (e) => {
        const ann = getAnnouncementForEvent(e, announcements);
        if (ann) onEditAnnouncement(ann);
    };
    const handleEvent = (e, r) => {
        if (!editMode) return setPopup({ event: e, rect: r });
        if (e.announcement && onEditAnnouncement) return handleAnnouncementClick(e);
        openModal(e, 'society', e.start_time);
    };
    return <MonthView selectedDate={selectedDate} events={events} onDateSelect={setSelectedDate}
        readOnly={!editMode} onEventClick={handleEvent} onMoreClick={setSummaryDate} customTags={tags} />;
}

function CalendarPopovers({ popup, setPopup, props, events, summaryDate, setSummaryDate }) {
    const { tags, onViewAnnouncement, editMode, eventHandlers } = props;
    const { openModal } = useEventModal();
    const confirmFn = useConfirm();
    const close = () => setPopup({ event: null, rect: null });
    const onDelete = handleEventDeletion(eventHandlers, close, confirmFn);
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
    const onDelete = handleEventDeletion(eventHandlers, closeModal, confirmFn);
    if (!isModalOpen || !editMode) return null;
    return (
        <EventModal event={modalEvent} initialDate={modalInitialDate} onClose={closeModal}
            showReminder={false} customTags={tags}
            onSubmit={(data) => handleModalSubmit(data, modalEvent, eventHandlers, closeModal)}
            onDelete={modalEvent?.id ? () => onDelete(modalEvent) : null} />
    );
}
