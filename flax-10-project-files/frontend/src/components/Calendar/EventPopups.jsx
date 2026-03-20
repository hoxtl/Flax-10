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
import HoldConfirmModal from '../common/HoldConfirmModal/HoldConfirmModal';

export function EventPopups({ allowModuleLeave = true }) {
    return (
        <>
            <EventModalContainer />
            <EventPopupContainer allowModuleLeave={allowModuleLeave} />
        </>
    );
}

function EventModalContainer() {
    const { isModalOpen, closeModal, modalEvent, modalType, modalInitialDate } = useEventModal();
    if (!isModalOpen) return null;
    return <EventModal event={modalEvent} onClose={closeModal} initialType={modalType} initialDate={modalInitialDate} />;
}

function EventPopupContainer({ allowModuleLeave }) {
    const { popupEvent, popupAnchorRect, closePopup, readOnly, viewMode } = useEventPopup();
    const { isModalOpen, openModal } = useEventModal();
    const { loadEvents } = useCalendarEvents();
    const { removeEvent, addException } = useEventActions();
    const { disenrollFromModule } = useModuleDisenrollment();
    const { getTag, refreshTags } = useTags();
    const toast = useToast();
    const notify = useNotify();
    const confirmFn = useConfirm();
    const [deleteTarget, setDeleteTarget] = useState(null);
    const showToast = (message, variant = "success") => {
        if (typeof toast === "function") {
            toast(message, { variant });
        }
    };

    if (isModalOpen || (!popupEvent && !deleteTarget)) return null;

    const tag = popupEvent ? getEventTag(popupEvent, getTag) : null;
    const onDeleteWrapped = async (ev) => {
        closePopup();
        if (hasRecurrence(ev)) {
            const choice = await confirmFn({
                title: "Delete Recurring Event",
                message: "This is a recurring event. How would you like to delete it?",
                confirmText: "Delete ALL occurrences",
                alternateText: "Delete ONLY this one",
                cancelText: "Cancel",
                isDanger: true
            });
            if (choice === true) { await executeDelete(ev, { removeEvent }); showToast(`"${ev.title}" has been deleted`); }
            else if (choice === 'ALTERNATE') { await deleteRecurrenceOccurrence(ev, { addException }); showToast(`"${ev.title}" occurrence has been deleted`); }
        } else {
            setDeleteTarget(ev);
        }
    };
    const handlers = { openModal, onDeleteRequest: onDeleteWrapped, closePopup, loadEvents, disenrollFromModule, refreshTags, showToast };
    const actions = popupEvent ? getCalendarPopupActions(popupEvent, handlers, { allowModuleLeave }) : null;

    return (
        <>
            {popupEvent && <EventPopover event={popupEvent} anchorRect={popupAnchorRect} onClose={closePopup} actions={actions} tag={tag} readOnly={readOnly} viewMode={viewMode} />}
            {deleteTarget && (
                <HoldConfirmModal
                    title="Delete Event"
                    warningText={`"${deleteTarget.title}" will be permanently deleted. This action cannot be undone.`}
                    cancelLabel="Keep Event"
                    holdLabel="Hold to Delete"
                    onConfirm={async () => {
                        await executeDelete(deleteTarget, { removeEvent });
                        showToast(`"${deleteTarget.title}" has been deleted`);
                        setDeleteTarget(null);
                    }}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}
        </>
    );
}

function getEventTag(event, getTag) {
    const societyTag = { label: event.tag_name, color: event.tag_color || event.society_color || '#9E7E5D' };
    return (event.source === 'society' && event.tag_name) ? societyTag : getTag(event.tag);
}

function getCalendarPopupActions(event, handlers, options = {}) {
    const type = getEventType(event);
    if (type === 'personal') return getPersonalActions(event, handlers);
    if (type === 'module') return getModuleActions(event, handlers, options);
    if (type === 'society') return getSocietyActions(event, handlers);
    return null;
}

function getPersonalActions(event, { openModal, onDeleteRequest, closePopup }) {
    return [
        { label: 'Edit', onClick: () => { closePopup(); openModal(event); } },
        { label: 'Delete', variant: 'danger', onClick: () => onDeleteRequest(event) }
    ];
}

function getModuleActions(event, { closePopup, loadEvents, disenrollFromModule }, { allowModuleLeave = true } = {}) {
    if (!allowModuleLeave) return null;
    const tagName = (event.tag_name || event.tag?.name || '').toLowerCase();
    if (tagName === 'lecture') return null;
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
        showToast(`Calendar for ${event.society_name || 'this society'} has been unsynced`);
    };
    return [{ label: 'Unsync', variant: 'danger', onClick: handleUnsync }];
}
