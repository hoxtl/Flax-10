import { useState } from 'react';
import { recordAttendance } from '../../api/attendanceApi';
import { setPromptedId } from './attendancePromptStorage';
import { useCandidateEvent } from './hooks/useCandidateEvent';
import AttendancePromptModal from './AttendancePromptModal.jsx';

const submitAnswer = async (event, attended, setEvent, setSubmitting) => {
  setSubmitting(true);
  try {
    await recordAttendance(event.id, attended);
  } catch {
    // still mark as prompted so we don't re-prompt
  }
  setPromptedId(event.id);
  setEvent(null);
  setSubmitting(false);
};

export default function AttendancePrompt() {
  const [event, setEvent] = useCandidateEvent();
  const [submitting, setSubmitting] = useState(false);

  const handleAnswer = (attended) => {
    if (!event || submitting) return;
    submitAnswer(event, attended, setEvent, setSubmitting);
  };

  const handleDismiss = () => {
    if (event) setPromptedId(event.id);
    setEvent(null);
  };

  if (!event) return null;
  return (
    <AttendancePromptModal
      event={event}
      submitting={submitting}
      onAnswer={handleAnswer}
      onDismiss={handleDismiss}
    />
  );
}
