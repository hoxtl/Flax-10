import { useState } from 'react';
import { useCalendarDispatch, useEventModal, useEventPopup } from '../../context/CalendarContext';
import { EventModal } from './EventModal/EventModal';
import { EventPopover } from './EventPopover/EventPopover';
import { useTags } from '../../context/TagContext';
import { useCalendarEvents, useEventActions } from './hooks/useCalendarEvents';
import { useModuleDisenrollment } from '../Modules/hooks/useModuleDisenrollment';
import { getEventType, hasRecurrence } from './utils/eventUtils';
import { executeDelete, deleteRecurrenceOccurrence } from './utils/formUtils';
import { unsyncCalendar } from '../../api/societyApi';
import { useConfirm } from '../../context/ConfirmContext';
import { useNotify } from '../Notifications/hooks/useNotify';
import { useToast } from '../../context/ToastContext';

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

function useEventDeletion() {
    const { removeEvent, addException } = useEventActions();
    const confirmFn = useConfirm();

    const handleDeleteRequest = async (event) => {
        const recurring = hasRecurrence(event);
        if (recurring) {
            const choice = await confirmFn({
                title: "Delete Recurring Event",
                message: "This is a recurring event. How would you like to delete it?",
                confirmText: "Delete ALL occurrences",
                alternateText: "Delete ONLY this one",
                cancelText: "Cancel",
                isDanger: true
            });
            if (choice === true) { await executeDelete(event, { removeEvent }); return true; }
            else if (choice === 'ALTERNATE') { await deleteRecurrenceOccurrence(event, { addException }); return true; }
        } else {
            const choice = await confirmFn({
                title: "Delete Event",
                message: `Are you sure you want to delete "${event.title}"? This cannot be undone.`,
                confirmText: "Delete",
                cancelText: "Cancel",
                isDanger: true
            });
            if (choice) { await executeDelete(event, { removeEvent }); return true; }
        }
        return false;
    };
    return { handleDeleteRequest };
}

function EventPopupContainer() {
    const { popupEvent, popupAnchorRect, closePopup, readOnly, viewMode } = useEventPopup();
    const { isModalOpen, openModal } = useEventModal();
    const { loadEvents } = useCalendarEvents();
    const { disenrollFromModule } = useModuleDisenrollment();
    const { getTag, refreshTags } = useTags();
    const toast = useToast();
    const notify = useNotify();
    const showToast = (title, message) => {
        if (typeof toast === "function") {
            toast(message === undefined ? title : `${title}: ${message}`, { variant: "info" });
        }
        if (typeof notify === "function" && message !== undefined) notify(title, message);
    };
    const { handleDeleteRequest } = useEventDeletion();

    if (isModalOpen || !popupEvent) return null;

    const tag = getEventTag(popupEvent, getTag);
    const onDeleteWrapped = async (ev) => {
        closePopup();
        const deleted = await handleDeleteRequest(ev);
        if (deleted) showToast("Event deleted", `"${ev.title}" deleted.`);
    };
    const handlers = { openModal, onDeleteRequest: onDeleteWrapped, closePopup, loadEvents, disenrollFromModule, refreshTags, showToast };
    const actions = getCalendarPopupActions(popupEvent, handlers);
    return <EventPopover event={popupEvent} anchorRect={popupAnchorRect} onClose={closePopup} actions={actions} tag={tag} readOnly={readOnly} viewMode={viewMode} />;
}

function getEventTag(event, getTag) {
    const societyTag = { label: event.tag_name, color: event.tag_color || event.society_color || '#9E7E5D' };
    return (event.source === 'society' && event.tag_name) ? societyTag : getTag(event.tag);
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

function getModuleActions(event, { closePopup, loadEvents, disenrollFromModule }) {
    const handleLeave = () => {
        closePopup();
        disenrollFromModule(event.module, loadEvents);
    };
    return [{ label: 'Leave Module', variant: 'danger', onClick: handleLeave }];
}

function getSocietyActions(event, { closePopup, loadEvents, refreshTags, showToast }) {
    const handleUnsync = async () => {
        closePopup();
        await unsyncCalendar(event.society_id);
        await refreshTags();
        loadEvents();
        showToast(
          "Unsync Successful",
          `Calendar for ${event.society_name || 'this society'} is now unsynced.`
        );
    };
    return [{ label: 'Unsync', variant: 'danger', onClick: handleUnsync }];
}
