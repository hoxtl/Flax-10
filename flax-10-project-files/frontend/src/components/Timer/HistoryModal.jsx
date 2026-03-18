import { useState, useEffect, useMemo } from 'react';
import styles from './HistoryModal.module.css';
import { getHistory, clearHistory } from './utils/historyUtils';
import { groupHistoryByBlock, formatDate, formatTimeRange, formatDuration } from './utils/historyFormatter';
import { useConfirm } from '../../context/ConfirmContext';
import StandardModal from '../common/StandardModal/StandardModal';

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
    const task = block.task ? <div className={styles.blockTask}>🎯 {block.task}</div> : null;
    const stats = <StatsRow block={block} />;
    return <div className={styles.studyBlockCard}>{header}{task}{stats}</div>;
};

const HistoryList = ({ blocks }) => {
    const list = blocks.map(block => <StudyBlock key={block.id} block={block} />);
    return <div className={styles.list}>{list}</div>;
};

const ClearButton = ({ onClear }) => {
    const btn = <button className={styles.clearButton} onClick={onClear}>Clear History</button>;
    return <div className={styles.clearButtonWrap}>{btn}</div>;
};

const useClearAction = (setHistory, confirm) => {
    const triggerClear = async () => {
        const confirmed = await confirm({
            title: "Clear History",
            message: "Are you sure you want to delete your history? All your data will be removed.",
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
    const content = <ModalContent history={history} blocks={blocks} />;
    const cBtn = history.length > 0 ? <ClearButton onClear={triggerClear} /> : null;
    return (
        <StandardModal
            title="History"
            onClose={onClose}
            size="md"
            modalClassName={styles.modalShell}
            contentClassName={styles.modalContent}
        >
            {content}
            {cBtn}
        </StandardModal>
    );
}
