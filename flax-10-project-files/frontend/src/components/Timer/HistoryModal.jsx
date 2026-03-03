import { useState, useEffect, useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import styles from './HistoryModal.module.css';
import { getHistory, clearHistory } from './utils/historyUtils';
import { groupHistoryByBlock, formatDate, formatTimeRange, formatDuration } from './utils/historyFormatter';

const HistoryHeader = ({ onClose }) => {
    const title = <h2 className={styles.title}>History</h2>;
    const btn = <button className={styles.closeButton} onClick={onClose}>×</button>;
    return <div className={styles.header}>{title}{btn}</div>;
};

const StatsRow = ({ block }) => {
    const sPill = <div className={`${styles.statPill} ${styles.sessionPill}`}>✅ {block.sessions.length} Sessions</div>;
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

const ClearConfirmModal = ({ onConfirm, onCancel }) => {
    const icon = <div style={{ minWidth: '40px', height: '40px', borderRadius: '50%', border: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151' }}><AlertCircle size={20} /></div>;
    const title = <h3 style={{ margin: '0 0 0.5rem 0', color: '#111827', fontSize: '1.25rem', fontWeight: 600 }}>Are you sure?</h3>;
    const msg = <p style={{ margin: 0, color: '#6b7280', lineHeight: 1.5 }}>Are you sure you want to delete your history?<br />All your data will be removed.</p>;
    const textCol = <div style={{ flex: 1, textAlign: 'left' }}>{title}{msg}</div>;
    const topRow = <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>{icon}{textCol}</div>;
    const cancelBtn = <button style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white', color: '#111827', fontWeight: 500, cursor: 'pointer' }} onClick={onCancel}>Cancel</button>;
    const confirmBtn = <button style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none', background: '#111827', color: 'white', fontWeight: 500, cursor: 'pointer' }} onClick={(e) => onConfirm(e)}>Confirm</button>;
    const btns = <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>{cancelBtn}{confirmBtn}</div>;
    const content = <div className={styles.modal} style={{ maxWidth: '450px', padding: '1.5rem' }} onClick={e => e.stopPropagation()}>{topRow}{btns}</div>;
    return <div className={styles.overlay} style={{ zIndex: 1001 }} onClick={onCancel}>{content}</div>;
};

const useHistoryData = () => {
    const [history, setHistory] = useState([]);
    const [showConfirm, setShowConfirm] = useState(false);
    useEffect(() => { getHistory().then(setHistory); }, []);
    const blocks = useMemo(() => groupHistoryByBlock(history), [history]);
    const triggerClear = () => setShowConfirm(true);
    const cancelClear = () => setShowConfirm(false);
    const confirmClear = async (e) => {
        if (e) e.stopPropagation();
        await clearHistory();
        setHistory([]);
        setShowConfirm(false);
    };
    return { history, blocks, showConfirm, triggerClear, cancelClear, confirmClear };
};

const ModalContent = ({ history, blocks }) => {
    const empty = <div className={styles.empty}>No recent sessions.</div>;
    const list = <HistoryList blocks={blocks} />;
    return <div className={styles.content}>{history.length === 0 ? empty : list}</div>;
};

export default function HistoryModal({ onClose }) {
    const { history, blocks, showConfirm, triggerClear, cancelClear, confirmClear } = useHistoryData();
    const hdr = <HistoryHeader onClose={onClose} />;
    const content = <ModalContent history={history} blocks={blocks} />;
    const cBtn = history.length > 0 ? <ClearButton onClear={triggerClear} /> : null;
    const inner = <div className={styles.modal} onClick={e => e.stopPropagation()}>{hdr}{content}{cBtn}</div>;
    const confirmPopup = showConfirm ? <ClearConfirmModal onConfirm={confirmClear} onCancel={cancelClear} /> : null;
    return <><div className={styles.overlay} onClick={onClose}>{inner}</div>{confirmPopup}</>;
}
