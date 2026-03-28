import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HistoryModal from '../../../../components/timer/components/HistoryModal';
import { ConfirmProvider } from '../../../../context/ConfirmContext';
import * as historyUtils from '../../../../components/timer/utils/historyUtils';
import {
    mockHistoryData, expectBlock1Summary, expectBlock2Summary,
    expectLegacyBlockSummary, expectDatesPresent, expectSessionCounts
} from '../../../utils/historyTestHelpers';

const onClose = vi.fn();

const renderModal = () => render(
    <ConfirmProvider><HistoryModal onClose={onClose} /></ConfirmProvider>
);

const setupWrapper = () => {
    vi.clearAllMocks();
    vi.spyOn(historyUtils, 'getHistory').mockResolvedValue([]);
    vi.spyOn(historyUtils, 'clearHistory').mockResolvedValue();
    onClose.mockClear();
};

const testHistoryList = async () => {
    historyUtils.getHistory.mockResolvedValue(mockHistoryData);
    renderModal();
    await screen.findByText('✅ 2 Sessions');
};

const testClearHistory = async () => {
    historyUtils.getHistory.mockResolvedValue([{ id: 1, duration: 25 }]);
    renderModal();
    const clearBtn = await screen.findByText('Clear History');
    fireEvent.click(clearBtn);

    const confirmBtn = await screen.findByText('Confirm');
    fireEvent.click(confirmBtn);

    await waitFor(() => expect(historyUtils.clearHistory).toHaveBeenCalled());
};

const testClose = async () => {
    renderModal();
    fireEvent.click(await screen.findByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
};

const testEmptyState = async () => {
    renderModal();
    expect(await screen.findByText('History')).toBeInTheDocument();
    expect(screen.getByText('No recent sessions.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
};

const testCancelClear = async () => {
    historyUtils.getHistory.mockResolvedValue([{ id: 1, duration: 25 }]);
    render(
        <ConfirmProvider>
            <HistoryModal onClose={onClose} />
        </ConfirmProvider>
    );
    fireEvent.click(await screen.findByText('Clear History'));
    await screen.findByText('Cancel');
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    expect(historyUtils.clearHistory).not.toHaveBeenCalled();
};

const testSingularSession = async () => {
    historyUtils.getHistory.mockResolvedValue([{
        id: 99, startTime: new Date().toISOString(), endTime: new Date().toISOString(),
        duration: 25, breakDuration: 0, studyBlockId: 'block_singular', status: 'Completed'
    }]);
    render(
        <ConfirmProvider>
            <HistoryModal onClose={onClose} />
        </ConfirmProvider>
    );
    await screen.findByText(/✅ 1 Session$/);
};

const testBlockWithTask = async () => {
    historyUtils.getHistory.mockResolvedValue([{
        id: 55, startTime: new Date().toISOString(), endTime: new Date().toISOString(),
        duration: 25, breakDuration: 0, studyBlockId: 'block_task', status: 'Completed',
        task: 'Write unit tests'
    }]);
    render(
        <ConfirmProvider>
            <HistoryModal onClose={onClose} />
        </ConfirmProvider>
    );
    await screen.findByText(/Write unit tests/);
};

const testCancelClearViaOverlay = async () => {
    historyUtils.getHistory.mockResolvedValue([{ id: 1, duration: 25 }]);
    render(
        <ConfirmProvider>
            <HistoryModal onClose={onClose} />
        </ConfirmProvider>
    );
    fireEvent.click(await screen.findByText('Clear History'));
    await screen.findByText('Confirm');
    const overlays = document.querySelectorAll('[class*="confirmOverlay"]');
    if (overlays.length > 0) fireEvent.click(overlays[0]);
    expect(historyUtils.clearHistory).not.toHaveBeenCalled();
};

const testUncompletedBlockWithPause = async () => {
    historyUtils.getHistory.mockResolvedValue([{
        id: 77,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        duration: 25,
        breakDuration: 0,
        pauseDuration: 120,
        studyBlockId: 'block_incomplete',
        status: 'Incomplete',
    }]);
    render(
        <ConfirmProvider>
            <HistoryModal onClose={onClose} />
        </ConfirmProvider>
    );
    await screen.findByText('❌ Uncompleted');
    expect(screen.getByText(/Pause/)).toBeInTheDocument();
};

describe('HistoryModal', () => {
    beforeEach(setupWrapper);
    it('renders empty state correctly', testEmptyState);

    it('renders history list grouped by study blocks', testHistoryList);

    it('clears history when button is clicked', testClearHistory);

    it('calls onClose when close button is clicked', testClose);

    it('cancels clear via Cancel button', testCancelClear);

    it('shows singular Session for exactly 1 completed session', testSingularSession);

    it('shows task label when block has a task', testBlockWithTask);

    it('cancels clear by clicking confirm overlay', testCancelClearViaOverlay);

    it('shows uncompleted and pause pills for incomplete paused blocks', testUncompletedBlockWithPause);
});
