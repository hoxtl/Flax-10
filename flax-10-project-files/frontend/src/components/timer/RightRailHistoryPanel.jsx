/*
 * Right rail timer history panel.
 */

import styles from '../../pages/Timer/TimerPage.module.css';
import historyStyles from './HistoryModal.module.css';
import PrimaryButton from '../common/primary_button/PrimaryButton';
import HoldConfirmModal from '../common/hold_confirm_modal/HoldConfirmModal';
import { HistoryRailSection } from './history_panel/HistoryRailSection';
import { WeeklyChart } from './history_panel/WeeklyChart';
import { clearRightRailHistory, useRightRailHistory } from './history_panel/useRightRailHistory';

function ClearHistoryAction({ setShowClearModal }) {
    return (
        <div className={styles.rightHistoryActions}>
            <PrimaryButton type="button" variant="primary" pill size="small" onClick={() => setShowClearModal(true)}>Clear History</PrimaryButton>
        </div>
    );
}

function ClearHistoryModal({ state }) {
    if (!state.showClearModal) return null;

    return (
        <HoldConfirmModal title="Clear History" warningText="This will permanently delete all logged sessions. This action cannot be undone." cancelLabel="Keep History" holdLabel="Hold to Clear" onConfirm={() => clearRightRailHistory(state.setHistory, state.setShowClearModal)} onCancel={() => state.setShowClearModal(false)} />
    );
}

export default function RightRailHistoryPanel() {
    const state = useRightRailHistory();
    if (state.visibleBlocks.length === 0) return <div className={historyStyles.empty}>No recent sessions.</div>;

    return (
        <div className={styles.rightHistoryPanel}>
            <WeeklyChart weeklySeries={state.weeklySeries} maxWeeklySeconds={state.maxWeeklySeconds} />
            <div className={styles.rightHistorySections}>{state.groupedByHorizon.map((group) => <HistoryRailSection key={group.label} group={group} />)}</div>

            <ClearHistoryAction setShowClearModal={state.setShowClearModal} />
            <ClearHistoryModal state={state} />
        </div>
    );
}
