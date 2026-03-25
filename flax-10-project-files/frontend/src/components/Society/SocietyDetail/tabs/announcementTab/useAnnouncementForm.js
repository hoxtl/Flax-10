import { useEffect, useState } from "react";
import { fetchSocietyEvent } from "../../../../../api/societyApi";
import { useConfirm } from "../../../../../context/ConfirmContext";
import { getInitialForm, validateForm } from "./AnnouncementModalHelpers";

function findPinConflict(announcements, formId) {
  return announcements.find((announcement) => announcement.pinned && announcement.id !== formId);
}

async function handlePinConflict(form, other, confirmFn, onSubmit) {
  const ok = await confirmFn({
    title: "Replace Pinned",
    message: `"${other.title}" is already pinned. Replace it?`,
    confirmText: "Replace",
    cancelText: "Cancel",
  });
  if (ok) {
    onSubmit(form, other);
  }
}

async function handlePinnedSubmit(form, announcements, confirmFn, onSubmit) {
  const other = findPinConflict(announcements, form.id);
  if (other) {
    return handlePinConflict(form, other, confirmFn, onSubmit);
  }
  onSubmit(form);
}

function makeSubmit(form, announcements, confirmFn, onSubmit, setError) {
  return async () => {
    const error = validateForm(form);
    if (error) {
      setError(error);
      return;
    }
    if (form.pinned) {
      return handlePinnedSubmit(form, announcements, confirmFn, onSubmit);
    }
    onSubmit(form);
  };
}

function mergeEventData(prev, event) {
  return {
    ...prev,
    addAsEvent: true,
    start_time: event.start_time?.slice(0, 16),
    end_time: event.end_time?.slice(0, 16),
    recurrence: event.recurrence,
    all_day: event.all_day,
  };
}

function loadLinkedEvent(announcement, societyId, setForm) {
  if (!announcement?.event_id || !societyId) return;
  fetchSocietyEvent(societyId, announcement.event_id)
    .then((event) => setForm((prev) => mergeEventData(prev, event)))
    .catch((err) => { console.error('Failed to load linked event:', err); });
}

export function useAnnouncementForm(announcement, societyId, onSubmit, announcements) {
  const [form, setForm] = useState(getInitialForm(announcement));
  const [error, setError] = useState("");
  const confirmFn = useConfirm();

  useEffect(() => {
    loadLinkedEvent(announcement, societyId, setForm);
  }, [announcement, societyId]);

  const submit = makeSubmit(form, announcements, confirmFn, onSubmit, setError);
  return { form, setForm, error, submit };
}
