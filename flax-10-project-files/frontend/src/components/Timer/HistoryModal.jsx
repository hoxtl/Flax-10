import { useState, useEffect, useMemo } from 'react';
import styles from './HistoryModal.module.css';
import { getHistory, clearHistory } from './utils/historyUtils';
import { groupHistoryByBlock, formatDate, formatTimeRange, formatDuration } from './utils/historyFormatter';

const HistoryHeader = ({ onClose }) => (
    <div className={styles.header}>
        <h2 className={styles.title}>History</h2>
        <button className={styles.closeButton} onClick={onClose}>×</button>
    </div>
);

const StatsRow = ({ block }) => (
    <div className={styles.statsRow}>
        <div className={`${styles.statPill} ${styles.sessionPill}`}>✅ {block.sessions.length} Sessions</div>
        <div className={`${styles.statPill} ${styles.focusPill}`}>🔥 {formatDuration(block.totalDuration)} Focus</div>
        {block.totalBreak > 0 && <div className={`${styles.statPill} ${styles.breakPill}`}>☕ {formatDuration(block.totalBreak)} Break</div>}
        {block.totalPause > 0 && <div className={`${styles.statPill} ${styles.pausePill}`}>⏸️ {formatDuration(block.totalPause)} Pause</div>}
    </div>
);

const StudyBlock = ({ block }) => (
    <div className={styles.studyBlockCard}>
        <div className={styles.blockHeader}>
            <span className={styles.blockDate}>{formatDate(block.startTime)}</span>
            <span className={styles.blockTime}>{formatTimeRange(block.startTime, block.endTime)}</span>
        </div>
        {block.task && <div style={{ marginBottom: '0.5rem', fontWeight: 600, color: '#4b5563' }}>🎯 {block.task}</div>}
        <StatsRow block={block} />
    </div>
);

const HistoryList = ({ blocks }) => (
    <div className={styles.list}>
        {blocks.map(block => <StudyBlock key={block.id} block={block} />)}
    </div>
);

const ClearButton = ({ onClear }) => (
    <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
        <button className={styles.clearButton} onClick={onClear}>Clear History</button>
    </div>
);

/** Custom hook to manage history state and deletion logic */
const useHistoryData = () => {
    const [history, setHistory] = useState([]);
    useEffect(() => { getHistory().then(setHistory); }, []);
    const blocks = useMemo(() => groupHistoryByBlock(history), [history]);
    const clear = async () => {
        if (confirm('Clear all study history?')) {
            await clearHistory();
            setHistory([]);
        }
    };
    return { history, blocks, clear };
};

const ModalContent = ({ history, blocks }) => (
    <div className={styles.content}>
        {history.length === 0 ? <div className={styles.empty}>No recent sessions.</div> : <HistoryList blocks={blocks} />}
    </div>
);

export default function HistoryModal({ onClose }) {
    const { history, blocks, clear } = useHistoryData();
    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <HistoryHeader onClose={onClose} />
                <ModalContent history={history} blocks={blocks} />
                {history.length > 0 && <ClearButton onClear={clear} />}
            </div>
        </div>
    );
}
