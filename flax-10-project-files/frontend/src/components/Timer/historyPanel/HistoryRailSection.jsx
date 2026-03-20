/*
 * Right rail history sections.
 */

import styles from '../../../pages/Timer/TimerPage.module.css';
import PrimaryButton from '../../common/PrimaryButton/PrimaryButton';
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

function EarlierToggle({ group, earlierExpanded, setEarlierExpanded, hiddenCount }) {
  if (group.label !== 'Earlier' || group.entries.length <= 1) return null;

  return (
    <div className={styles.rightHistoryShowMoreWrap}>
      <PrimaryButton type="button" pill size="small" onClick={() => setEarlierExpanded((value) => !value)}>
        {earlierExpanded ? 'Show less ↑' : `Show all ${hiddenCount + 1} →`}
      </PrimaryButton>
    </div>
  );
}

export function HistoryRailSection({ group, earlierExpanded, setEarlierExpanded }) {
  const visibleEntries = group.label === 'Earlier' && !earlierExpanded ? group.entries.slice(0, 1) : group.entries;
  const hiddenCount = group.label === 'Earlier' ? Math.max(0, group.entries.length - visibleEntries.length) : 0;

  return (
    <section className={styles.rightHistorySection}>
      <div className={styles.rightHistorySectionTitle}>{group.label}</div>
      <ul className={styles.rightHistoryCardList}>{visibleEntries.map((block, index) => <HistoryCard key={`${group.label}-${block.id ?? index}`} block={block} />)}</ul>
      <EarlierToggle group={group} earlierExpanded={earlierExpanded} setEarlierExpanded={setEarlierExpanded} hiddenCount={hiddenCount} />
    </section>
  );
}
