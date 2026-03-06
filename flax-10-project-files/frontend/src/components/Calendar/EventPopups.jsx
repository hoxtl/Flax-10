import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEventModal, useEventPopup } from '../../context/CalendarContext';
import { useTimerContext } from '../../context/TimerContext';
import { EventModal } from './EventModal/EventModal';
import { EventDetailPopup } from './EventDetailPopup';
import { useTags } from '../../context/TagContext';
import { useCalendarEvents, useEventActions } from './hooks/useCalendarEvents';
import { getEventType, hasRecurrence } from './utils/eventUtils';
import { executeDelete, deleteRecurrenceOccurrence } from './utils/formUtils';
import { disenrolByModuleId } from '../../api/moduleApi';
import { unsyncCalendar } from '../../api/societyApi';
import { deleteTask } from '../../api/taskService';
import ConfirmModal from '../common/ConfirmModal';

export function EventPopups() {
    return (
        <>
            <EventModalContainer />
            <EventPopupContainer />
        </>
    );
}

function EventModalContainer() {
    const { isModalOpen, closeModal, modalEvent, modalType, modalInitialDate } = useEventModal();
    if (!isModalOpen) return null;
    return <EventModal event={modalEvent} onClose={closeModal} initialType={modalType} initialDate={modalInitialDate} />;
}

function useEventDeletion(closePopup) {
    const { removeEvent, addException } = useEventActions();
    const [deleteEventState, setDeleteEvent] = useState(null);
    const handleDeleteRequest = (event) => { closePopup(); setDeleteEvent(event); };
    const onConfirm = async () => {
        if (!deleteEventState) return;
        const recurring = hasRecurrence(deleteEventState);
        const choice = recurring ? window.confirm('Delete recurring event?\n\nOK = ALL occurrences\nCancel = ONLY this one') : true;
        if (choice) await executeDelete(deleteEventState, { removeEvent });
        else await deleteRecurrenceOccurrence(deleteEventState, { addException });
        setDeleteEvent(null);
    };
    return { deleteEventState, handleDeleteRequest, handleDeleteConfirm: onConfirm, handleDeleteCancel: () => setDeleteEvent(null) };
}

function EventPopupContainer() {
    const { popupEvent, popupAnchorRect, closePopup, readOnly } = useEventPopup();
    const { isModalOpen, openModal } = useEventModal();
    const { loadEvents } = useCalendarEvents();
    const { setActiveTaskId } = useTimerContext();
    const tags = useTags();
    const navigate = useNavigate();
    const { deleteEventState, handleDeleteRequest, handleDeleteConfirm, handleDeleteCancel } = useEventDeletion(closePopup);

    if (deleteEventState) return <DeleteConfirmModal event={deleteEventState} onConfirm={handleDeleteConfirm} onCancel={handleDeleteCancel} />;
    if (isModalOpen || !popupEvent) return null;

    const tag = getEventTag(popupEvent, tags);
    const handlers = {
        openModal,
        onDeleteRequest: handleDeleteRequest,
        closePopup,
        loadEvents,
        navigate,
        setActiveTaskId,
    };
    const actions = readOnly ? null : getCalendarPopupActions(popupEvent, handlers);
    return <EventDetailPopup event={popupEvent} tag={tag} anchorRect={popupAnchorRect} onClose={closePopup} actions={actions} />;
}

function DeleteConfirmModal({ event, onConfirm, onCancel }) {
    return <ConfirmModal title="Delete Event" message={`Are you sure you want to delete "${event.title}"? This cannot be undone.`} onConfirm={onConfirm} onCancel={onCancel} />;
}

function getEventTag(event, tags) {
    const societyTag = { label: event.tag_name, color: event.tag_color || event.society_color || '#9E7E5D' };
    return (event.source === 'society' && event.tag_name) ? societyTag : tags.getTag(event.tag);
}

function getCalendarPopupActions(event, handlers) {
    if (event?.timelineReadOnly) return null;
    if (event?.forcePersonalPopup) return getPersonalActions(event, handlers);
    const type = getEventType(event);
    if (type === 'personal') return getPersonalActions(event, handlers);
    if (type === 'task') return getTaskActions(event, handlers);
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

function getTaskActions(event, { closePopup, loadEvents, navigate, setActiveTaskId }) {
    const taskId = getTaskIdFromEvent(event);
    const focusTask = () => {
        closePopup();
        if (taskId != null) setActiveTaskId(taskId, { title: event.title });
        navigate('/timer', { state: { fromTaskPlay: true } });
    };
    const removeTask = async () => {
        if (taskId == null) return;
        closePopup();
        await deleteTask(taskId);
        await loadEvents();
    };
    return [
        { label: '▶ Focus', onClick: focusTask },
        { label: 'Delete Task', variant: 'danger', onClick: removeTask },
    ];
}

function getTaskIdFromEvent(event) {
    const raw = event?.external_id;
    if (raw == null) return null;
    const asNumber = Number(raw);
    return Number.isFinite(asNumber) ? asNumber : null;
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
    const handleUnsync = async () => {
        closePopup();
        await unsyncCalendar(event.society_id);
        loadEvents();
    };
    return [{ label: 'Unsync', variant: 'danger', onClick: handleUnsync }];
}
