/**
 * EventPopups - Container for event modal and popover components.
 * Manages event editing, deletion, and quick actions.
 */
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

/** Main container rendering both modal and popover. */
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

function useToastNotify() {
  const toast = useToast();
  const notify = useNotify();
  return (title, message) => {
    if (typeof toast === "function") {
      toast(message === undefined ? title : `${title}: ${message}`, { variant: "info" });
    }
    if (typeof notify === "function" && message !== undefined) notify(title, message);
  };
}

async function confirmRecurringDelete(event, confirmFn, removeEvent, addException) {
  const choice = await confirmFn({
    title: "Delete Recurring Event", message: "This is a recurring event. How would you like to delete it?",
    confirmText: "Delete ALL occurrences", alternateText: "Delete ONLY this one", cancelText: "Cancel", isDanger: true
  });
  if (choice === true) { await executeDelete(event, { removeEvent }); return true; }
  if (choice === 'ALTERNATE') { await deleteRecurrenceOccurrence(event, { addException }); return true; }
  return false;
}

async function confirmSingleDelete(event, confirmFn, removeEvent) {
  const choice = await confirmFn({
    title: "Delete Event", message: `Are you sure you want to delete "${event.title}"? This cannot be undone.`,
    confirmText: "Delete", cancelText: "Cancel", isDanger: true
  });
  if (choice) { await executeDelete(event, { removeEvent }); return true; }
  return false;
}

function useEventDeletion() {
  const { removeEvent, addException } = useEventActions();
  const confirmFn = useConfirm();
  const handleDeleteRequest = async (event) => {
    return hasRecurrence(event)
      ? confirmRecurringDelete(event, confirmFn, removeEvent, addException)
      : confirmSingleDelete(event, confirmFn, removeEvent);
  };
  return { handleDeleteRequest };
}

function getEventTag(event, getTag) {
  const societyTag = { label: event.tag_name, color: event.tag_color || event.society_color || '#9E7E5D' };
  return (event.source === 'society' && event.tag_name) ? societyTag : getTag(event.tag);
}

function getPersonalActions(event, { openModal, onDeleteRequest, closePopup }) {
  return [
    { label: 'Edit', onClick: () => { closePopup(); openModal(event); } },
    { label: 'Delete', variant: 'danger', onClick: () => onDeleteRequest(event) }
  ];
}

function getModuleActions(event, { closePopup, loadEvents, disenrollFromModule }, { allowModuleLeave = true } = {}) {
  if (!allowModuleLeave) return null;
  return [{ label: 'Leave Module', variant: 'danger', onClick: () => { closePopup(); disenrollFromModule(event.module, loadEvents); } }];
}

function getSocietyActions(event, { closePopup, loadEvents, refreshTags, showToast }) {
  const handleUnsync = async () => {
    closePopup();
    await unsyncCalendar(event.society_id);
    await refreshTags();
    loadEvents();
    showToast("Unsync Successful", `Calendar for ${event.society_name || 'this society'} is now unsynced.`);
  };
  return [{ label: 'Unsync', variant: 'danger', onClick: handleUnsync }];
}

function getCalendarPopupActions(event, handlers, options = {}) {
  const type = getEventType(event);
  if (type === 'personal') return getPersonalActions(event, handlers);
  if (type === 'module') return getModuleActions(event, handlers, options);
  if (type === 'society') return getSocietyActions(event, handlers);
  return null;
}

function usePopupState() {
  const { popupEvent, popupAnchorRect, closePopup, readOnly, viewMode } = useEventPopup();
  const { isModalOpen, openModal } = useEventModal();
  const { loadEvents } = useCalendarEvents();
  const { disenrollFromModule } = useModuleDisenrollment();
  const { getTag, refreshTags } = useTags();
  const showToast = useToastNotify();
  const { handleDeleteRequest } = useEventDeletion();
  return { popupEvent, popupAnchorRect, closePopup, readOnly, viewMode, isModalOpen, openModal, loadEvents, disenrollFromModule, getTag, refreshTags, showToast, handleDeleteRequest };
}

function EventPopupContainer({ allowModuleLeave }) {
  const state = usePopupState();
  if (state.isModalOpen || !state.popupEvent) return null;

  const onDeleteWrapped = async (ev) => {
    state.closePopup();
    if (await state.handleDeleteRequest(ev)) state.showToast("Event deleted", `"${ev.title}" deleted.`);
  };
  const handlers = { openModal: state.openModal, onDeleteRequest: onDeleteWrapped, closePopup: state.closePopup, loadEvents: state.loadEvents, disenrollFromModule: state.disenrollFromModule, refreshTags: state.refreshTags, showToast: state.showToast };
  const actions = getCalendarPopupActions(state.popupEvent, handlers, { allowModuleLeave });

  return <EventPopover event={state.popupEvent} anchorRect={state.popupAnchorRect} onClose={state.closePopup} actions={actions} tag={getEventTag(state.popupEvent, state.getTag)} readOnly={state.readOnly} viewMode={state.viewMode} />;
}
