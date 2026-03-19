import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from '../../pages/Timer/TimerPage.module.css';
import historyStyles from './HistoryModal.module.css';
import PrimaryButton from '../common/PrimaryButton/PrimaryButton';
import HoldConfirmModal from '../common/HoldConfirmModal/HoldConfirmModal';
import { getHistory, clearHistory } from './utils/historyUtils';
import { groupHistoryByBlock, formatTimeRange, formatDuration } from './utils/historyFormatter';

function extractModuleLabel(block) {
    if (block.module) return block.module;
    const sessions = Array.isArray(block.sessions) ? block.sessions : [];
    const s = sessions.find(x => x?.module || x?.module_code || x?.moduleCode);
    return s?.module || s?.module_code || s?.moduleCode || null;
}

/* ── Date Utils ── */

function startOfDay(d) {
    const res = new Date(d);
    res.setHours(0, 0, 0, 0);
    return res;
}

function getHorizon(dateValue, now = new Date()) {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return 'Earlier';
    const diff = Math.round((startOfDay(now).getTime() - startOfDay(d).getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    return startOfDay(d) >= startOfDay(weekStart) ? 'This Week' : 'Earlier';
}

function getSeries(blocks, now = new Date()) {
    const { days, map } = initSeries(now);
    blocks.forEach(b => {
        const d = new Date(b.startTime || b.endTime || Date.now());
        const bucket = map.get(startOfDay(d).toISOString().slice(0, 10));
        if (bucket) bucket.seconds += Number(b.totalDuration || 0);
    });
    return days;
}

function initSeries(now) {
    const days = [];
    const map = new Map();
    for (let i = 6; i >= 0; i--) {
        const d = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i));
        const key = d.toISOString().slice(0, 10);
        const item = { key, label: d.toLocaleDateString(undefined, { weekday: 'short' }), seconds: 0 };
        days.push(item);
        map.set(key, item);
    }
    return { days, map };
}

/* ── Components ── */
function StatusPills({ block, completed, total }) {
    const partial = completed === 0;
    return (
        <div className={styles.rightHistorySessionTags}>
            <span className={`${styles.rightHistoryStatusPill} ${partial ? styles.rightHistoryStatusPartial : ''}`}>{partial ? 'Partial' : 'Completed'}</span>
            <span className={styles.rightHistoryStatPill}>{completed}/{Math.max(total, 1)} sessions</span>
            {Number(block.totalBreak || 0) > 0 && <span className={styles.rightHistoryStatPill}>☕ {formatDuration(block.totalBreak)} break</span>}
        </div>
    );
}

function HistoryCard({ block }) {
    const sessions = block.sessions || [];
    const completed = sessions.filter(s => s?.status !== 'Incomplete').length;
    const moduleLabel = extractModuleLabel(block) || 'General';
    return (
        <li className={styles.rightHistorySessionCard}>
            <div className={styles.rightHistorySessionTop}>
                <span className={styles.rightHistorySessionTask}>{block.task || 'Focus Session'}</span>
                <span className={styles.rightHistorySessionDuration}>{formatDuration(block.totalDuration) || '0m'}</span>
            </div>
            <div className={styles.rightHistorySessionMeta}>
                <span>{moduleLabel}</span>
                <span>{formatTimeRange(block.startTime, block.endTime) || '—'}</span>
            </div>
            <StatusPills block={block} completed={completed} total={sessions.length} />
        </li>
    );
}

function WeeklyBar({ day, maxSec }) {
    const ratio = Math.max(0.04, Number(day.seconds || 0) / maxSec);
    const hours = (Number(day.seconds || 0) / 3600).toFixed(1);
    return (
        <div className={styles.rightHistoryWeeklyBarCol}>
            <div className={styles.rightHistoryWeeklyBarTrack}>
                <span className={styles.rightHistoryWeeklyBarFill} style={{ height: `${Math.round(ratio * 100)}%` }} />
            </div>
            <span className={styles.rightHistoryWeeklyBarLabel}>{day.label}</span>
            <span className={styles.rightHistoryWeeklyValue}>{hours}h</span>
        </div>
    );
}

function WeeklyChart({ blocks }) {
    const series = useMemo(() => getSeries(blocks), [blocks]);
    const maxSec = useMemo(() => Math.max(60, ...series.map(d => Number(d.seconds || 0))), [series]);
    return (
        <section className={styles.rightHistoryWeeklySummary}>
            <div className={styles.rightHistoryWeeklyHeader}>Weekly Summary</div>
            <div className={styles.rightHistoryWeeklyChart}>
                {series.map(d => <WeeklyBar key={d.key} day={d} maxSec={maxSec} />)}
            </div>
        </section>
    );
}

function useHistoryEvents(refresh) {
    useEffect(() => {
        const evs = ['timerHistoryUpdated', 'historyCleared'];
        evs.forEach(e => window.addEventListener(e, refresh));
        return () => evs.forEach(e => window.removeEventListener(e, refresh));
    }, [refresh]);
}

export default function RightRailHistoryPanel() {
    const [history, setHistory] = useState([]);
    const [showClear, setShowClear] = useState(false);
    const refresh = useCallback(async () => {
        try {
            const data = await getHistory();
            setHistory(Array.isArray(data) ? data : []);
        } catch { setHistory([]); }
    }, []);
    useHistoryEvents(refresh);
    useEffect(() => { refresh(); }, [refresh]);

    const blocks = useMemo(() => groupHistoryByBlock(history), [history]);
    const visible = useMemo(() => blocks.filter(b => Number(b.totalDuration || 0) >= 300 || (b.sessions || []).some(s => s?.status !== 'Incomplete')), [blocks]);
    const grouped = useMemo(() => {
        const ord = ['Today', 'Yesterday', 'This Week', 'Earlier'];
        const map = new Map(ord.map(k => [k, []]));
        visible.slice(0, 30).forEach(b => map.get(getHorizon(b.startTime)).push(b));
        return ord.map(label => ({ label, entries: map.get(label) })).filter(g => g.entries.length > 0);
    }, [visible]);

    if (!visible.length) return <div className={historyStyles.empty}>No recent sessions.</div>;
    return (
        <div className={styles.rightHistoryPanel}>
            <WeeklyChart blocks={blocks} />
            <div className={styles.rightHistorySections}>
                {grouped.map(g => (
                    <section key={g.label} className={styles.rightHistorySection}>
                        <div className={styles.rightHistorySectionTitle}>{g.label}</div>
                        <ul className={styles.rightHistoryCardList}>
                            {g.entries.map((b, i) => <HistoryCard key={b.id || i} block={b} />)}
                        </ul>
                    </section>
                ))}
            </div>
            <FooterActions onClear={() => setShowClear(true)} />
            {showClear && <ClearModal onConfirm={async () => { await clearHistory(); setHistory([]); setShowClear(false); }} onCancel={() => setShowClear(false)} />}
        </div>
    );
}

function FooterActions({ onClear }) {
    return (
        <div className={styles.rightHistoryActions}>
            <PrimaryButton type="button" variant="ghost" pill size="small" onClick={onClear}>Clear History</PrimaryButton>
        </div>
    );
}

function ClearModal({ onConfirm, onCancel }) {
    return (
        <HoldConfirmModal
            title="Clear History"
            warningText="This will permanently delete all logged sessions. This action cannot be undone."
            cancelLabel="Keep History"
            holdLabel="Hold to Clear"
            onConfirm={onConfirm}
            onCancel={onCancel}
        />
    );
}

