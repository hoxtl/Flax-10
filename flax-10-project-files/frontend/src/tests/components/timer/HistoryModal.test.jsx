import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HistoryModal from '../../../components/Timer/HistoryModal';
import * as historyUtils from '../../../components/Timer/utils/historyUtils';
import {
    mockHistoryData, expectBlock1Summary, expectBlock2Summary,
    expectLegacyBlockSummary, expectDatesPresent, expectSessionCounts
} from '../../utils/historyTestHelpers';

const onClose = vi.fn();

const setupWrapper = () => {
    vi.spyOn(historyUtils, 'getHistory').mockResolvedValue([]);
    vi.spyOn(historyUtils, 'clearHistory').mockResolvedValue();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    onClose.mockClear();
};

const testHistoryList = async () => {
    historyUtils.getHistory.mockResolvedValue(mockHistoryData);
    render(<HistoryModal onClose={onClose} />);
    await screen.findByText('✅ 2 Sessions'); // Wait for async render
};

const testClearHistory = async () => {
    historyUtils.getHistory.mockResolvedValue([{ id: 1, duration: 25 }]);
    render(<HistoryModal onClose={onClose} />);
    const clearBtn = await screen.findByText('Clear History');
    fireEvent.click(clearBtn);
    expect(window.confirm).toHaveBeenCalled();
    expect(historyUtils.clearHistory).toHaveBeenCalled();
};

const testClose = async () => {
    render(<HistoryModal onClose={onClose} />);
    fireEvent.click(await screen.findByText('×'));
    expect(onClose).toHaveBeenCalled();
};

const testEmptyState = async () => {
    render(<HistoryModal onClose={onClose} />);
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
