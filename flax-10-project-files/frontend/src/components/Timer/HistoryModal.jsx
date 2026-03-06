import { useState, useEffect, useMemo } from 'react';
import styles from './HistoryModal.module.css';
import { getHistory, clearHistory } from './utils/historyUtils';
import { groupHistoryByBlock, formatDate, formatTimeRange, formatDuration } from './utils/historyFormatter';
import { useConfirm } from '../../context/ConfirmContext';

const HistoryHeader = ({ onClose }) => {
    const title = <h2 className={styles.title}>History</h2>;
    const btn = <button className={styles.closeButton} onClick={onClose}>×</button>;
    return <div className={styles.header}>{title}{btn}</div>;
};

const StatsRow = ({ block }) => {
    const completedCount = block.sessions.filter(s => s.status !== 'Incomplete').length;
    const sText = completedCount > 0 ? `✅ ${completedCount} Session${completedCount !== 1 ? 's' : ''}` : '❌ Uncompleted';
    const sPill = <div className={`${styles.statPill} ${styles.sessionPill}`}>{sText}</div>;
    const fPill = <div className={`${styles.statPill} ${styles.focusPill}`}>🔥 {formatDuration(block.totalDuration)} Focus</div>;
    const bPill = block.totalBreak > 0 ? <div className={`${styles.statPill} ${styles.breakPill}`}>☕ {formatDuration(block.totalBreak)} Break</div> : null;
    const pPill = block.totalPause > 0 ? <div className={`${styles.statPill} ${styles.pausePill}`}>⏸️ {formatDuration(block.totalPause)} Pause</div> : null;
    return <div className={styles.statsRow}>{sPill}{fPill}{bPill}{pPill}</div>;
};

const StudyBlock = ({ block }) => {
    const date = <span className={styles.blockDate}>{formatDate(block.startTime)}</span>;
    const time = <span className={styles.blockTime}>{formatTimeRange(block.startTime, block.endTime)}</span>;
    const header = <div className={styles.blockHeader}>{date}{time}</div>;
    const task = block.task ? <div style={{ marginBottom: '0.5rem', fontWeight: 600, color: '#4b5563' }}>🎯 {block.task}</div> : null;
    const stats = <StatsRow block={block} />;
    return <div className={styles.studyBlockCard}>{header}{task}{stats}</div>;
};

const HistoryList = ({ blocks }) => {
    const list = blocks.map(block => <StudyBlock key={block.id} block={block} />);
    return <div className={styles.list}>{list}</div>;
};

const ClearButton = ({ onClear }) => {
    const btn = <button className={styles.clearButton} onClick={onClear}>Clear History</button>;
    return <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>{btn}</div>;
};

const useClearAction = (setHistory, confirm) => {
    const triggerClear = async () => {
        const confirmed = await confirm({
            title: "Clear History",
            message: "Are you sure you want to delete your history? All your data will be removed.",
            confirmText: "Clear",
            isDanger: true,
        });
        if (!confirmed) return;
        await clearHistory();
        setHistory([]);
        window.dispatchEvent(new Event('historyCleared'));
    };
    return { triggerClear };
};

const useHistoryData = (confirm) => {
    const [history, setHistory] = useState([]);
    useEffect(() => { getHistory().then(setHistory); }, []);
    const blocks = useMemo(() => groupHistoryByBlock(history), [history]);
    const { triggerClear } = useClearAction(setHistory, confirm);
    return { history, blocks, triggerClear };
};

const ModalContent = ({ history, blocks }) => {
    const empty = <div className={styles.empty}>No recent sessions.</div>;
    const list = <HistoryList blocks={blocks} />;
    return <div className={styles.content}>{history.length === 0 ? empty : list}</div>;
};

export default function HistoryModal({ onClose }) {
    const confirm = useConfirm();
    const { history, blocks, triggerClear } = useHistoryData(confirm);
    const hdr = <HistoryHeader onClose={onClose} />;
    const content = <ModalContent history={history} blocks={blocks} />;
    const cBtn = history.length > 0 ? <ClearButton onClear={triggerClear} /> : null;
    const inner = <div className={styles.modal} onClick={e => e.stopPropagation()}>{hdr}{content}{cBtn}</div>;
    return <div className={styles.overlay} onClick={onClose}>{inner}</div>;
}
