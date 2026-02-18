import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HistoryModal from '../../../components/Timer/HistoryModal';
import * as historyUtils from '../../../utils/historyUtils';
import {
    mockHistoryData, expectBlock1Summary, expectBlock2Summary,
    expectLegacyBlockSummary, expectDatesPresent, expectSessionCounts
} from '../../utils/historyTestHelpers';

const onClose = vi.fn();

const setupWrapper = () => {
    vi.spyOn(historyUtils, 'getHistory').mockReturnValue([]);
    vi.spyOn(historyUtils, 'clearHistory').mockImplementation(() => { });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    onClose.mockClear();
};

const testEmptyState = () => {
    render(<HistoryModal onClose={onClose} />);
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('No recent sessions.')).toBeInTheDocument();
    expect(screen.getByText('×')).toBeInTheDocument();
};

const testHistoryList = () => {
    historyUtils.getHistory.mockReturnValue(mockHistoryData);
    render(<HistoryModal onClose={onClose} />);
    expectBlock1Summary();
    expectBlock2Summary();
    expectLegacyBlockSummary();
    expectDatesPresent();
    expectSessionCounts();
};

const testClearHistory = () => {
    historyUtils.getHistory.mockReturnValue([{ id: 1, duration: 25 }]);
    render(<HistoryModal onClose={onClose} />);
    fireEvent.click(screen.getByText('Clear History'));
    expect(window.confirm).toHaveBeenCalled();
    expect(historyUtils.clearHistory).toHaveBeenCalled();
};

const testClose = () => {
    render(<HistoryModal onClose={onClose} />);
    fireEvent.click(screen.getByText('×'));
    expect(onClose).toHaveBeenCalled();
};

describe('HistoryModal', () => {
    beforeEach(setupWrapper);
    it('renders empty state correctly', testEmptyState);
    it('renders history list grouped by study blocks', testHistoryList);
    it('clears history when button is clicked', testClearHistory);
    it('calls onClose when close button is clicked', testClose);
});
