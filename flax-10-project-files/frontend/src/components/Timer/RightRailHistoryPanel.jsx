import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from '../../pages/Timer/TimerPage.module.css';
import historyStyles from './HistoryModal.module.css';
import PrimaryButton from '../common/PrimaryButton/PrimaryButton';
import HoldConfirmModal from '../common/HoldConfirmModal/HoldConfirmModal';
import { getHistory, clearHistory } from './utils/historyUtils';
import { groupHistoryByBlock, formatTimeRange, formatDuration } from './utils/historyFormatter';

function startOfDay(dateLike) {
    const d = new Date(dateLike);
    d.setHours(0, 0, 0, 0);
    return d;
}

function getHistoryHorizonLabel(dateValue, now = new Date()) {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return 'Earlier';
    const today = startOfDay(now);
    const target = startOfDay(date);
    const diffDays = Math.round((today.getTime() - target.getTime()) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    if (target >= weekStart) return 'This Week';
    return 'Earlier';
}

function getSevenDayFocusSeries(blocks, now = new Date()) {
    const days = [];
    const dayMap = new Map();
    for (let i = 6; i >= 0; i -= 1) {
        const d = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i));
        const key = d.toISOString().slice(0, 10);
        const item = { key, label: d.toLocaleDateString(undefined, { weekday: 'short' }), seconds: 0 };
        days.push(item);
        dayMap.set(key, item);
    }
    blocks.forEach((block) => {
        const date = new Date(block.startTime || block.endTime || Date.now());
        if (Number.isNaN(date.getTime())) return;
        const key = startOfDay(date).toISOString().slice(0, 10);
        const bucket = dayMap.get(key);
        if (bucket) bucket.seconds += Number(block.totalDuration || 0);
    });
    return days;
}

const extractModuleLabel = (block) => {
    if (block.module) return block.module;
    const session = Array.isArray(block.sessions)
        ? block.sessions.find((s) => s?.module || s?.module_code || s?.moduleCode || s?.list)
        : null;
    return session?.module || session?.module_code || session?.moduleCode || session?.list || null;
};

function HistoryCard({ block, groupLabel, idx }) {
    const completedCount = Array.isArray(block.sessions) ? block.sessions.filter(s => s?.status !== 'Incomplete').length : 0;
    const totalSessions = Array.isArray(block.sessions) ? block.sessions.length : 0;
    const partial = completedCount === 0;
    return (
        <li className={styles.rightHistorySessionCard}>
            <div className={styles.rightHistorySessionTop}>
                <span className={styles.rightHistorySessionTask}>{block.task || 'Focus Session'}</span>
                <span className={styles.rightHistorySessionDuration}>{formatDuration(block.totalDuration) || '0m'}</span>
            </div>
            <div className={styles.rightHistorySessionMeta}>
                <span>{extractModuleLabel(block) || 'General'}</span>
                <span>{formatTimeRange(block.startTime, block.endTime) || '—'}</span>
            </div>
            <div className={styles.rightHistorySessionTags}>
                <span className={`${styles.rightHistoryStatusPill} ${partial ? styles.rightHistoryStatusPartial : ''}`}>
                    {partial ? 'Partial' : 'Completed'}
                </span>
                <span className={styles.rightHistoryStatPill}>{completedCount}/{Math.max(totalSessions, 1)} sessions</span>
                {Number(block.totalBreak || 0) > 0 && (
                    <span className={styles.rightHistoryStatPill}>☕ {formatDuration(block.totalBreak)} break</span>
                )}
            </div>
        </li>
    );
}

function WeeklyChart({ weeklySeries, maxWeeklySeconds }) {
    return (
        <section className={styles.rightHistoryWeeklySummary}>
            <div className={styles.rightHistoryWeeklyHeader}>Weekly Summary</div>
            <div className={styles.rightHistoryWeeklyChart} role="img" aria-label="Focus hours per day for the last 7 days">
                {weeklySeries.map((day) => {
                    const ratio = Math.max(0.04, Number(day.seconds || 0) / maxWeeklySeconds);
                    const hours = (Number(day.seconds || 0) / 3600).toFixed(1);
                    return (
                        <div key={day.key} className={styles.rightHistoryWeeklyBarCol}>
                            <div className={styles.rightHistoryWeeklyBarTrack}>
                                <span className={styles.rightHistoryWeeklyBarFill} style={{ height: `${Math.round(ratio * 100)}%` }} />
                            </div>
                            <span className={styles.rightHistoryWeeklyBarLabel}>{day.label}</span>
                            <span className={styles.rightHistoryWeeklyValue}>{hours}h</span>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

export default function RightRailHistoryPanel() {
    const [history, setHistory] = useState([]);
    const [earlierExpanded, setEarlierExpanded] = useState(false);
    const [showClearModal, setShowClearModal] = useState(false);

    const refresh = useCallback(async () => {
        try {
            const data = await getHistory();
            setHistory(Array.isArray(data) ? data : []);
        } catch { setHistory([]); }
    }, []);

    useEffect(() => {
        refresh();
        window.addEventListener('timerHistoryUpdated', refresh);
        window.addEventListener('historyCleared', refresh);
        return () => {
            window.removeEventListener('timerHistoryUpdated', refresh);
            window.removeEventListener('historyCleared', refresh);
        };
    }, [refresh]);

    const blocks = useMemo(() => groupHistoryByBlock(history), [history]);
    const visibleBlocks = useMemo(() => blocks.filter((block) => {
        const secs = Number(block.totalDuration || 0);
        const completed = Array.isArray(block.sessions) ? block.sessions.filter(s => s?.status !== 'Incomplete').length : 0;
        return secs >= 300 || completed > 0;
    }), [blocks]);

    const groupedByHorizon = useMemo(() => {
        const order = ['Today', 'Yesterday', 'This Week', 'Earlier'];
        const map = new Map(order.map((k) => [k, []]));
        visibleBlocks.slice(0, 24).forEach((block) => map.get(getHistoryHorizonLabel(block.startTime)).push(block));
        return order.map((label) => ({ label, entries: map.get(label) || [] })).filter((g) => g.entries.length > 0);
    }, [visibleBlocks]);

    const weeklySeries = useMemo(() => getSevenDayFocusSeries(blocks), [blocks]);
    const maxWeeklySeconds = useMemo(() => Math.max(60, ...weeklySeries.map(d => Number(d.seconds || 0))), [weeklySeries]);

    const handleConfirmClear = useCallback(async () => {
        setShowClearModal(false);
        await clearHistory();
        setHistory([]);
        window.dispatchEvent(new Event('historyCleared'));
    }, []);

    if (visibleBlocks.length === 0) return <div className={historyStyles.empty}>No recent sessions.</div>;

    return (
        <div className={styles.rightHistoryPanel}>
            <WeeklyChart weeklySeries={weeklySeries} maxWeeklySeconds={maxWeeklySeconds} />
            <div className={styles.rightHistorySections}>
                {groupedByHorizon.map((group) => {
                    const isEarlier = group.label === 'Earlier';
                    const visibleEntries = isEarlier && !earlierExpanded ? group.entries.slice(0, 1) : group.entries;
                    const hiddenCount = isEarlier ? Math.max(0, group.entries.length - visibleEntries.length) : 0;
                    return (
                        <section key={group.label} className={styles.rightHistorySection}>
                            <div className={styles.rightHistorySectionTitle}>{group.label}</div>
                            <ul className={styles.rightHistoryCardList}>
                                {visibleEntries.map((block, idx) => (
                                    <HistoryCard key={`${group.label}-${block.id ?? idx}`} block={block} groupLabel={group.label} idx={idx} />
                                ))}
                            </ul>
                            {isEarlier && group.entries.length > 1 && (
                                <div className={styles.rightHistoryShowMoreWrap}>
                                    <PrimaryButton type="button" pill size="small" onClick={() => setEarlierExpanded(p => !p)}>
                                        {earlierExpanded ? 'Show less ↑' : `Show all ${hiddenCount + 1} →`}
                                    </PrimaryButton>
                                </div>
                            )}
                        </section>
                    );
                })}
            </div>
            <div className={styles.rightHistoryActions}>
                <PrimaryButton type="button" variant="ghost" pill size="small" onClick={() => setShowClearModal(true)}>
                    Clear History
                </PrimaryButton>
            </div>
            {showClearModal && (
                <HoldConfirmModal
                    title="Clear History"
                    warningText="This will permanently delete all logged sessions. This action cannot be undone."
                    cancelLabel="Keep History"
                    holdLabel="Hold to Clear"
                    onConfirm={handleConfirmClear}
                    onCancel={() => setShowClearModal(false)}
                />
            )}
        </div>
    );
}
