import ConfirmModal from "../common/ConfirmModal/ConfirmModal";

/** Single responsibility: render the "Did you attend?" dialog UI. */
export default function AttendancePromptModal({ event, submitting, onAnswer, onDismiss }) {
  return (
    <ConfirmModal
      title="Did you attend?"
      message={event.title}
      onConfirm={() => onAnswer(true)}
      onCancel={onDismiss}
      onAlternate={() => onAnswer(false)}
      confirmText="Yes"
      alternateText="No"
      cancelText="Dismiss"
      centerText
    />
  );
}
