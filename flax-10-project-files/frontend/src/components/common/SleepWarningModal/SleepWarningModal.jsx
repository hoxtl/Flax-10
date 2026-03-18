import ConfirmModal from "../ConfirmModal/ConfirmModal";

export function SleepWarningModal({ sleepTime, wakeTime, onConfirm, onCancel }) {
  const formatTime = (t) => {
    if (!t) return t;
    const [h, m] = t.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${period}`;
  };

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
