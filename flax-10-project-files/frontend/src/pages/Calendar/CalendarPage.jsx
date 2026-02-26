import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from '../../components/Calendar/Calendar';
import PillFilters from '../../components/Tags/PillFilters';
import { useCalendar, useCalendarDispatch, useEventModal, useEventPopup } from '../../context/CalendarContext';
import styles from './CalendarPage.module.css';
import { EventModal } from '../../components/Calendar/EventModal/EventModal';
import { EventDetailPopup } from '../../components/Calendar/EventDetailPopup';
import { useTags } from '../../context/TagContext';
import { useCalendarEvents, useEventActions } from '../../components/Calendar/hooks/useCalendarEvents';
import { getEventType, hasRecurrence } from '../../components/Calendar/utils/eventUtils';
import { executeDelete, deleteRecurrenceOccurrence } from '../../components/Calendar/utils/formUtils';
import { disenrolByModuleId } from '../../api/moduleApi';
import { unsyncCalendar } from '../../api/societyApi';
import ConfirmModal from '../../components/shared/ConfirmModal';

export default function CalendarPage() {
    const { filter, allEvents } = useCalendar();
    const dispatch = useCalendarDispatch();
    const handleFilterChange = (key) => {
        dispatch({ type: 'SET_FILTER', payload: key });
    };
    return (
        <div className={styles.page}>
            <div className={styles.filters}>
                <PillFilters active={filter} onChange={handleFilterChange} items={allEvents} />
            </div>
            <Calendar />
            <EventModalContainer />
            <EventPopupContainer />
        </div>);
}

function EventModalContainer() {
    const { isModalOpen, closeModal, modalEvent, modalType, modalInitialDate } = useEventModal();
    if (!isModalOpen) return null;
    return (
        <EventModal
            event={modalEvent}
            onClose={closeModal}
            initialType={modalType}
            initialDate={modalInitialDate}
        />
    );
}

function EventPopupContainer() {
    const { popupEvent, popupAnchorRect, closePopup } = useEventPopup();
    const { isModalOpen, openModal } = useEventModal();
    const { removeEvent, addException } = useEventActions();
    const { loadEvents } = useCalendarEvents();
    const tags = useTags();
    const navigate = useNavigate();
    const [deleteEventState, setDeleteEvent] = useState(null);

    const handleDeleteRequest = (event) => { closePopup(); setDeleteEvent(event); };
    const handleDeleteConfirm = async () => {
        if (!deleteEventState) return;
        try {
            const recurring = hasRecurrence(deleteEventState);
            const choice = recurring ? window.confirm('Delete recurring event?\n\nOK = ALL occurrences\nCancel = ONLY this one') : true;

            if (choice) await executeDelete(deleteEventState, { removeEvent });
            else await deleteRecurrenceOccurrence(deleteEventState, { addException });
        } catch (err) {
            console.error('Deletion failed:', err);
        }
        setDeleteEvent(null);
    };
    const handleDeleteCancel = () => setDeleteEvent(null);

    if (deleteEventState) {
        return <DeleteConfirmModal event={deleteEventState} onConfirm={handleDeleteConfirm} onCancel={handleDeleteCancel} />;
    }
    if (isModalOpen || !popupEvent) return null;

    const tag = getEventTag(popupEvent, tags);
    const handlers = { openModal, onDeleteRequest: handleDeleteRequest, closePopup, loadEvents, navigate };
    const actions = getCalendarPopupActions(popupEvent, handlers);
    return <EventDetailPopup event={popupEvent} tag={tag} anchorRect={popupAnchorRect} onClose={closePopup} actions={actions} />;
}

function DeleteConfirmModal({ event, onConfirm, onCancel }) {
    return (
        <ConfirmModal
            title="Delete Event"
            message={`Are you sure you want to delete "${event.title}"? This cannot be undone.`}
            onConfirm={onConfirm}
            onCancel={onCancel}
        />
    );
}

function getEventTag(event, tags) {
    if (event.source === 'society' && event.tag_name) {
        return { label: event.tag_name, color: event.tag_color || event.society_color || '#9E7E5D' };
    }
    return tags.getTag(event.tag);
}

function getCalendarPopupActions(event, handlers) {
    const type = getEventType(event);
    if (type === 'personal') return getPersonalActions(event, handlers);
    if (type === 'module') return getModuleActions(event, handlers);
    if (type === 'society') return getSocietyActions(event, handlers);
    return null;
}

function getPersonalActions(event, { openModal, onDeleteRequest, closePopup }) {
    return [
        { label: 'Edit', onClick: () => { closePopup(); openModal(event); } },
        { label: 'Delete', variant: 'danger', onClick: () => onDeleteRequest(event) }
    ];
}

function getModuleActions(event, { closePopup, loadEvents }) {
    const handleLeave = async () => {
        closePopup();
        await disenrolByModuleId(event.module);
        loadEvents();
    };
    return [{ label: 'Leave Module', variant: 'danger', onClick: handleLeave }];
}

function getSocietyActions(event, { closePopup, loadEvents }) {
    const actions = [];

    const handleUnsync = async () => {
        closePopup();
        await unsyncCalendar(event.society_id);
        loadEvents();
    };
    actions.push({ label: 'Unsync', variant: 'danger', onClick: handleUnsync });
    return actions;
}