/*
 * Right rail history sections.
 */

import styles from '../../../pages/Timer/TimerPage.module.css';
import PrimaryButton from '../../Common/PrimaryButton/PrimaryButton';
import { formatDuration, formatTimeRange } from '../utils/historyFormatter';
import { getModuleLabel } from './historyPanelUtils';

function HistoryCard({ block }) {
  const completedCount = Array.isArray(block.sessions) ? block.sessions.filter((session) => session?.status !== 'Incomplete').length : 0;
  const totalSessions = Array.isArray(block.sessions) ? block.sessions.length : 0;
  const partial = completedCount === 0;

  return (
    <li className={styles.rightHistorySessionCard}>
      <div className={styles.rightHistorySessionTop}>
        <span className={styles.rightHistorySessionTask}>{block.task || 'Focus Session'}</span>
        <span className={styles.rightHistorySessionDuration}>{formatDuration(block.totalDuration) || '0m'}</span>
      </div>
      <div className={styles.rightHistorySessionMeta}>
        <span>{getModuleLabel(block) || 'General'}</span>
        <span>{formatTimeRange(block.startTime, block.endTime) || '—'}</span>
      </div>
      <HistoryTags block={block} partial={partial} completedCount={completedCount} totalSessions={totalSessions} />
    </li>
  );
}

function HistoryTags({ block, partial, completedCount, totalSessions }) {
  return (
    <div className={styles.rightHistorySessionTags}>
      <span className={`${styles.rightHistoryStatusPill} ${partial ? styles.rightHistoryStatusPartial : ''}`}>{partial ? 'Partial' : 'Completed'}</span>
      <span className={styles.rightHistoryStatPill}>{completedCount}/{Math.max(totalSessions, 1)} sessions</span>
      {Number(block.totalBreak || 0) > 0 && <span className={styles.rightHistoryStatPill}>☕ {formatDuration(block.totalBreak)} break</span>}
    </div>
  );
}


export function HistoryRailSection({ group }) {
  return (
    <section className={styles.rightHistorySection}>
      <div className={styles.rightHistorySectionTitle}>{group.label}</div>
      <ul className={styles.rightHistoryCardList}>{group.entries.map((block, index) => <HistoryCard key={`${group.label}-${block.id ?? index}`} block={block} />)}</ul>
    </section>
  );
}

