import StudyCoachPanel from '../StudyCoachPanel';
import styles from './AIInsightsTab.module.css';

export function ChatPanel({ period }) {
  return (
    <StudyCoachPanel
      period={period}
      subtitle="Ask anything about your habits"
      className={styles.chatPanel}
    />
  );
}
