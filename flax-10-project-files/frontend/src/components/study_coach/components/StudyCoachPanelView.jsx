/*
 * Assembled study coach panel UI.
 */

import StudyCoachComposer from "./StudyCoachComposer";
import StudyCoachHeader from "./StudyCoachHeader";
import StudyCoachMessages from "./StudyCoachMessages";
import styles from "../styles/studyCoachStyles";
import { useStudyCoachPanel } from "../hooks/useStudyCoachPanel";

export default function StudyCoachPanelView({
  period = 30,
  initialMessage = "",
  title = "Flax Bot",
  subtitle = "Ask me anything",
  placeholder = "Ask me anything…",
  className = "",
  onClose,
}) {
  const coach = useStudyCoachPanel(initialMessage, period);
  return (
    <div className={`${styles.root} ${className}`.trim()}>
      <StudyCoachHeader title={title} subtitle={subtitle} hasMessages={coach.messages.length > 0} onClear={coach.clearMessages} onClose={onClose} />
      <StudyCoachMessages messages={coach.messages} loading={coach.loading} error={coach.error} bottomRef={coach.bottomRef} onSend={coach.sendMessage} />
      <StudyCoachComposer input={coach.input} loading={coach.loading} onChange={(event) => coach.setInput(event.target.value)} onKeyDown={coach.handleKeyDown} onSend={coach.sendMessage} placeholder={placeholder} />
    </div>
  );
}
