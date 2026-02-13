import { useState, useEffect, useMemo } from 'react';
import styles from './HistoryModal.module.css';
import { getHistory, clearHistory } from '../../utils/historyUtils';

export default function HistoryModal({ onClose }) {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        setHistory(getHistory());
    }, []);

    const studyBlocks = useMemo(() => {
        const blocks = {};
        history.forEach(session => {
            // Group by studyBlockId if available, otherwise fallback to individual session ID
            const blockId = session.studyBlockId || session.id;

            // Legacy fallback: Derive start/end from date/duration
            let startTime = session.startTime;
            let endTime = session.endTime;
            let date = session.date;

            const now = new Date().toISOString();

            if (!date) date = now;
            if (!endTime) endTime = date;
            if (!startTime) {
                const durationMs = (session.duration || 0) * 60000;
                // Safely handle invalid date strings
                const endTs = new Date(endTime).getTime();
                startTime = !isNaN(endTs) ? new Date(endTs - durationMs).toISOString() : now;
            }

            if (!blocks[blockId]) {
                blocks[blockId] = {
                    id: blockId,
                    sessions: [],
                    totalDuration: 0,
                    totalBreak: 0,
                    startTime,
                    endTime,
                    date
                };
            }
            const block = blocks[blockId];
            block.sessions.push(session);
            block.totalDuration += session.duration;
            block.totalBreak += (session.breakDuration || 0);

            // Update min start and max end. Use timestamps for comparison and validity check
            const startTs = new Date(startTime).getTime();
            const endTs = new Date(endTime).getTime();

            if (!isNaN(startTs) && startTs < new Date(block.startTime).getTime()) block.startTime = startTime;
            if (!isNaN(endTs) && endTs > new Date(block.endTime).getTime()) block.endTime = endTime;
        });

        // Convert to array and sort by date descending
        return Object.values(blocks).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [history]);

    const formatTimeRange = (start, end) => {
        if (!start || !end) return '';
        const s = new Date(start);
        const e = new Date(end);
        return `${s.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${e.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            weekday: 'short', month: 'short', day: 'numeric'
        });
    };

    const handleClear = () => {
        if (confirm('Clear all study history?')) {
            clearHistory();
            setHistory([]);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>History</h2>
                    <button className={styles.closeButton} onClick={onClose}>×</button>
                </div>

                <div className={styles.content}>
                    {history.length === 0 ? (
                        <div className={styles.empty}>No recent sessions.</div>
                    ) : (
                        <div className={styles.list}>
                            {studyBlocks.map(block => (
                                <div key={block.id} className={styles.studyBlockCard}>
                                    <div className={styles.blockHeader}>
                                        <span className={styles.blockDate}>{formatDate(block.startTime)}</span>
                                        <span className={styles.blockTime}>{formatTimeRange(block.startTime, block.endTime)}</span>
                                    </div>
                                    <div className={styles.statsRow}>
                                        <div className={`${styles.statPill} ${styles.sessionPill}`}>
                                            ✅ {block.sessions.length} Sessions
                                        </div>
                                        <div className={`${styles.statPill} ${styles.focusPill}`}>
                                            🔥 {block.totalDuration}m Focus
                                        </div>
                                        {block.totalBreak > 0 && (
                                            <div className={`${styles.statPill} ${styles.breakPill}`}>
                                                ☕ {block.totalBreak}m Break
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {history.length > 0 && (
                    <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                        <button className={styles.clearButton} onClick={handleClear}>Clear History</button>
                    </div>
                )}
            </div>
        </div>
    );
}
