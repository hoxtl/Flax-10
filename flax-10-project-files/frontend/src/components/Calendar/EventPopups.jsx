/*
 * EventPopups.jsx
 * Container for event modal, popover, and deletion confirmation.
 */

import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';
import { useEventModal, useEventPopup, useEventDelete } from '../../context/CalendarContext';
<<<<<<< HEAD
import { EventModal } from './event_modal/EventModal';
import { EventPopover } from './event_popover/EventPopover';
=======
import { EventModal } from './EventModal/EventModal';
import { EventPopover } from './EventPopover/EventPopover';
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import { useTags } from '../../context/TagContext';
import { useCalendarEvents, useEventActions } from './hooks/useCalendarEvents';
import { getEventType, hasRecurrence } from './utils/eventUtils';
import { executeDelete, deleteRecurrenceOccurrence } from './utils/formUtils';
import { unsyncCalendar } from '../../api/societyApi';
<<<<<<< HEAD
import HoldConfirmModal from '../common/hold_confirm_modal/HoldConfirmModal';

/** Main entry point for calendar popups. */
=======
import HoldConfirmModal from '../common/HoldConfirmModal/HoldConfirmModal';
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

/** Main entry point for calendar popups. */
export function EventPopups() {
  return (
    <>
      <EventModalContainer />
      <EventPopupContainer />
      <HoldDeleteContainer />
    </>
  );
}

function EventModalContainer() {
  const { isModalOpen, closeModal, modalEvent, modalType, modalInitialDate } = useEventModal();
  if (!isModalOpen) return null;
  return <EventModal event={modalEvent} onClose={closeModal} initialType={modalType} initialDate={modalInitialDate} />;
}

function useEventDeletion() {
  const { openDelete } = useEventDelete();
  const confirmFn = useConfirm();
  const handleRecurring = async (evt) => {
    const c = await confirmFn({
      title: "Delete Recurring Event",
      message: "How would you like to delete this recurring event?",
      confirmText: "Delete ALL", alternateText: "Delete ONLY this", isDanger: true
    });
    if (c === true) openDelete(evt, 'all');
    else if (c === 'ALTERNATE') openDelete(evt, 'occurrence');
  };
  return {
    handleDeleteRequest: async (evt) => {
      if (hasRecurrence(evt)) await handleRecurring(evt);
      else openDelete(evt);
    }
  };
}

function HoldDeleteContainer() {
  const { isDeleteOpen, deleteEvent: evt, deleteType: type, closeDelete } = useEventDelete();
  const { removeEvent, addException } = useEventActions();
  const toast = useToast();
  if (!isDeleteOpen || !evt) return null;
  const onC = async () => {
    const act = { removeEvent, addException };
    if (type === 'occurrence') await deleteRecurrenceOccurrence(evt, act);
    else await executeDelete(evt, act);
    closeDelete(); toast(`"${evt.title}" deleted.`);
  };
  return <HoldConfirmModal title={`Delete "${evt.title}"`} warningText={type === 'all' ? "Delete ALL occurrences?" : "Confirm deletion."} onConfirm={onC} onCancel={closeDelete} />;
}
function getPopupActions(evt, s) {
    if (s.readOnly) return null;
    const type = getEventType(evt);
    const h = {
        edit: () => { s.closePopup(); s.openModal(evt); }, delete: () => { s.closePopup(); s.handleDeleteRequest(evt); },
        unsync: async () => {
            s.closePopup(); await unsyncCalendar(evt.society_id); await s.refreshTags();
            s.loadEvents(); s.toast(`Unsynced ${evt.society_name || 'society'}`);
        }
    };
    if (type === 'personal') return [{ label: 'Edit', onClick: h.edit }, { label: 'Delete', variant: 'danger', onClick: h.delete }];
    if (type === 'society') return [{ label: 'Unsync', variant: 'danger', onClick: h.unsync }];
    return null;
}

function usePopupState() {
  const { popupEvent, popupAnchorRect, closePopup, readOnly, viewMode } = useEventPopup();
  const { isModalOpen, openModal } = useEventModal();
  const { loadEvents } = useCalendarEvents();
  const { getTag, refreshTags } = useTags();
  const toast = useToast();
  const { handleDeleteRequest } = useEventDeletion();
  
  return { popupEvent, popupAnchorRect, closePopup, readOnly, viewMode, isModalOpen, openModal, loadEvents, getTag, refreshTags, toast, handleDeleteRequest };
}

function EventPopupContainer() {
  const state = usePopupState();
  if (state.isModalOpen || !state.popupEvent) return null;

  const actions = getPopupActions(state.popupEvent, state);
  const tag = (state.popupEvent.source === 'society' && state.popupEvent.tag_name) 
<<<<<<< HEAD
    ? { label: state.popupEvent.tag_name, color: state.popupEvent.tag_color || 'var(--color-caramel)' }
=======
    ? { label: state.popupEvent.tag_name, color: state.popupEvent.tag_color || '#9E7E5D' }
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    : state.getTag(state.popupEvent.tag);

  return (
    <EventPopover 
      event={state.popupEvent} anchorRect={state.popupAnchorRect} onClose={state.closePopup} 
      actions={actions} tag={tag} readOnly={state.readOnly} viewMode={state.viewMode} 
    />
  );
}

