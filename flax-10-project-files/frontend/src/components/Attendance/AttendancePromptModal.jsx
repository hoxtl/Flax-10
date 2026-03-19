/*
 * Attendance prompt modal UI.
 */

import ConfirmModal from "../common/ConfirmModal/ConfirmModal";

export default function AttendancePromptModal({ event, onAnswer, onDismiss }) {
  return <ConfirmModal title="Did you attend?" message={event.title} onConfirm={() => onAnswer(true)} onCancel={onDismiss} onAlternate={() => onAnswer(false)} confirmText="Yes" alternateText="No" cancelText="Dismiss" centerText />;
}
