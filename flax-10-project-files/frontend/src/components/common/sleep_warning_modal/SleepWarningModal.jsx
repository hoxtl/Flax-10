/*
 * Warning modal shown when a task is added during the user's configured sleep hours.
 */

import ConfirmModal from "../confirm_modal/ConfirmModal";

function formatTime(t) {
  if (!t) return t;
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

/** Confirm modal that warns the user they are working outside their sleep hours. */

export function SleepWarningModal({ sleepTime, wakeTime, onConfirm, onCancel }) {
  return (
    <ConfirmModal
      title="You should be resting!"
      message={<>Your sleep schedule is set from <strong>{formatTime(sleepTime)}</strong> to <strong>{formatTime(wakeTime)}</strong>. Working at this hour can affect your focus and wellbeing the next day. Are you sure you want to work at this hour?</>}
      cancelText="Cancel — I'll rest"
      confirmText="Add anyway"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
