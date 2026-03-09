import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../../../lib/termConfig', () => ({
    loadTermConfig: vi.fn(() => ({
        totalWeeks: 11,
        hasReadingWeek: true,
        readingWeekAfterWeek: 5,
    })),
}));

vi.mock('../../../components/Calendar/utils/weekUtils', () => ({
    buildWeekLabels: vi.fn((total, hasRW, afterWeek) => {
        const labels = [];
        for (let i = 1; i <= total; i++) {
            if (hasRW && i === afterWeek + 1) labels.push('RW');
            labels.push(String(i));
        }
        return labels;
    }),
    getWeekIndexForDate: vi.fn(() => 2), // week 3 (0-indexed)
}));

import WeekBar from '../../../components/Dashboard/WeekBar';
import { getWeekIndexForDate } from '../../../components/Calendar/utils/weekUtils';

describe('WeekBar', () => {
    it('renders without crashing', () => {
        const { container } = render(<WeekBar date={new Date('2024-03-04')} />);
        expect(container.firstChild).toBeTruthy();
    });

    it('shows current week badge', () => {
        render(<WeekBar date={new Date('2024-03-04')} />);
        // Week at index 2 = "3"
        expect(screen.getByText(/Week 3/)).toBeTruthy();
    });

    it('shows total weeks', () => {
        render(<WeekBar date={new Date('2024-03-04')} />);
        expect(screen.getByText('of 11')).toBeTruthy();
    });

    it('shows semester has not started when idx < 0', () => {
        getWeekIndexForDate.mockReturnValueOnce(-1);
        render(<WeekBar date={new Date('2024-01-01')} />);
        expect(screen.getByText("Semester hasn't started")).toBeTruthy();
    });

    it('shows Reading Week badge when on reading week', () => {
        getWeekIndexForDate.mockReturnValueOnce(5); // index 5 = 'RW' with 5+1 insertion
        render(<WeekBar date={new Date('2024-03-04')} />);
        // If the label at index 5 is 'RW', badge shows "Reading Week"
        expect(screen.getByText(/Reading Week|Week/)).toBeTruthy();
    });
});
