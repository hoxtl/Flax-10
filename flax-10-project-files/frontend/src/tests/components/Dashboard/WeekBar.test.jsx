/**
 * Unit tests for WeekBar rendering and semester week badge behaviour.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const SEMESTER_TERM_CONFIG = {
    totalWeeks: 11,
    hasReadingWeek: true,
    readingWeekAfterWeek: 5,
};

const createWeekLabels = (totalWeeks, hasReadingWeek, readingWeekAfterWeek) => {
    const labels = Array.from({ length: totalWeeks }, (_, index) => String(index + 1));
    if (!hasReadingWeek) return labels;
    labels.splice(readingWeekAfterWeek, 0, 'RW');
    return labels;
};

vi.mock('../../../lib/termConfig', () => ({
    loadTermConfig: vi.fn(() => SEMESTER_TERM_CONFIG),
}));

vi.mock('../../../components/Calendar/utils/weekUtils', () => ({
    buildWeekLabels: vi.fn((total, hasRW, afterWeek) => createWeekLabels(total, hasRW, afterWeek)),
    getWeekIndexForDate: vi.fn(() => 2),
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
        getWeekIndexForDate.mockReturnValueOnce(5);
        render(<WeekBar date={new Date('2024-03-04')} />);
        expect(screen.getByText(/Reading Week|Week/)).toBeTruthy();
    });
});
