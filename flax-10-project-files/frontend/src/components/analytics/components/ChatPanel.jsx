/*
 * Analytics wrapper for the study coach panel.
 */

import StudyCoachPanel from '../../study_coach/components/StudyCoachPanel';
import styles from '../styles/AIInsightsTab.module.css';

export function ChatPanel({ period }) {
  return (
    <StudyCoachPanel
      period={period}
      subtitle="Ask anything about your habits"
      className={styles.chatPanel}
    />
  );
}
