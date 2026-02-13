import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HistoryModal from '../../../components/Timer/HistoryModal';
import * as historyUtils from '../../../utils/historyUtils';

describe('HistoryModal', () => {
    const onClose = vi.fn();

    beforeEach(() => {
        vi.spyOn(historyUtils, 'getHistory').mockReturnValue([]);
        vi.spyOn(historyUtils, 'clearHistory').mockImplementation(() => { });
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        onClose.mockClear();
    });

    it('renders empty state correctly', () => {
        render(<HistoryModal onClose={onClose} />);
        expect(screen.getByText('History')).toBeInTheDocument();
        expect(screen.getByText('No recent sessions.')).toBeInTheDocument();
        expect(screen.getByText('×')).toBeInTheDocument();
    });

    it('renders history list grouped by study blocks', () => {
        const mockHistory = [
            {
                id: 1,
                date: '2023-01-01T12:00:00Z',
                startTime: '2023-01-01T12:00:00Z',
                endTime: '2023-01-01T12:25:00Z',
                duration: 25,
                breakDuration: 5,
                sessionCount: 1,
                studyBlockId: 'block_1',
                status: 'Completed'
            },
            {
                id: 2,
                date: '2023-01-01T12:30:00Z',
                startTime: '2023-01-01T12:30:00Z',
                endTime: '2023-01-01T12:55:00Z',
                duration: 25,
                breakDuration: 0,
                sessionCount: 2,
                studyBlockId: 'block_1', // Same block
                status: 'Completed'
            },
            {
                id: 3,
                date: '2023-01-02T14:30:00Z',
                startTime: '2023-01-02T14:00:00Z',
                endTime: '2023-01-02T14:30:00Z',
                duration: 30,
                breakDuration: 0,
                studyBlockId: 'block_2', // Different block
                status: 'Completed'
            },
            {
                id: 4,
                date: '2023-01-03T10:00:00Z', // Legacy data: no Start/End/BlockId
                duration: 60,
                status: 'Completed'
            }
        ];
        historyUtils.getHistory.mockReturnValue(mockHistory);

        render(<HistoryModal onClose={onClose} />);

        // Block 1 Aggregated:
        // Duration: 25 + 25 = 50m
        // Break: 5 + 0 = 5m
        // Sessions: 2
        // Time Range: covers 12:00 to 12:55

        // Check for stats
        expect(screen.getByText(/50m Focus/)).toBeInTheDocument();
        expect(screen.getByText(/5m Break/)).toBeInTheDocument();
        expect(screen.getByText(/2 Sessions/)).toBeInTheDocument();

        // Block 2 Aggregated:
        expect(screen.getByText(/30m Focus/)).toBeInTheDocument();

        // Legacy Block:
        expect(screen.getByText(/60m Focus/)).toBeInTheDocument();
        expect(screen.queryByText(/Invalid Date/)).not.toBeInTheDocument();

        // Check for Dates
        expect(screen.getByText(/Jan 1/)).toBeInTheDocument();
        expect(screen.getByText(/Jan 2/)).toBeInTheDocument();
        expect(screen.getByText(/Jan 3/)).toBeInTheDocument();

        // Check session counts
        const singleSessionPills = screen.getAllByText(/1 Sessions/);
        expect(singleSessionPills).toHaveLength(2); // One for block 2, one for legacy block
    });

    it('clears history when button is clicked', () => {
        historyUtils.getHistory.mockReturnValue([{ id: 1, duration: 25 }]);
        render(<HistoryModal onClose={onClose} />);

        const clearBtn = screen.getByText('Clear History');
        fireEvent.click(clearBtn);

        expect(window.confirm).toHaveBeenCalled();
        expect(historyUtils.clearHistory).toHaveBeenCalled();
    });

    it('calls onClose when close button is clicked', () => {
        render(<HistoryModal onClose={onClose} />);
        const closeBtn = screen.getByText('×');
        fireEvent.click(closeBtn);
        expect(onClose).toHaveBeenCalled();
    });
});
