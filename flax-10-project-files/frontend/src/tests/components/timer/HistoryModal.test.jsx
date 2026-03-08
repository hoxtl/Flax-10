import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HistoryModal from '../../../components/Timer/HistoryModal';
import { ConfirmProvider } from '../../../context/ConfirmContext';
import * as historyUtils from '../../../components/Timer/utils/historyUtils';
import {
    mockHistoryData, expectBlock1Summary, expectBlock2Summary,
    expectLegacyBlockSummary, expectDatesPresent, expectSessionCounts
} from '../../utils/historyTestHelpers';

const onClose = vi.fn();

const renderModal = () => render(
    <ConfirmProvider><HistoryModal onClose={onClose} /></ConfirmProvider>
);

const setupWrapper = () => {
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
    fireEvent.click(await screen.findByText('×'));
    expect(onClose).toHaveBeenCalled();
};

const testEmptyState = async () => {
    renderModal();
    expect(await screen.findByText('History')).toBeInTheDocument();
    expect(screen.getByText('No recent sessions.')).toBeInTheDocument();
    expect(screen.getByText('×')).toBeInTheDocument();
};

describe('HistoryModal', () => {
    beforeEach(setupWrapper);
    it('renders empty state correctly', testEmptyState);
    it('renders history list grouped by study blocks', testHistoryList);
    it('clears history when button is clicked', testClearHistory);
    it('calls onClose when close button is clicked', testClose);
});
