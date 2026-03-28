import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('@mui/x-charts/LineChart', () => ({
    LineChart: ({ series, height }) => (
        <div data-testid="line-chart" data-series={JSON.stringify(series.map(s => s.label))} data-height={height} />
    ),
}));

vi.mock('../../../../context/ThemeContext', () => ({
    useTheme: vi.fn(() => ({ theme: 'light' })),
}));

import StudyHoursChart from '../../../../components/analytics/components/StudyHoursChart';
import { useTheme } from '../../../../context/ThemeContext';

const mockData = [
    { date: '2024-03-01', work: 120, break: 30 },
    { date: '2024-03-02', work: 90, break: 20 },
    { date: '2024-03-03', work: 60, break: 15 },
];

describe('StudyHoursChart', () => {
    it('renders without crashing', () => {
        const { getByTestId } = render(<StudyHoursChart data={mockData} />);
        expect(getByTestId('line-chart')).toBeTruthy();
    });

    it('passes series with Study Hours and Break Hours labels', () => {
        const { getByTestId } = render(<StudyHoursChart data={mockData} />);
        const chart = getByTestId('line-chart');
        const series = JSON.parse(chart.getAttribute('data-series'));
        expect(series).toContain('Study Hours');
        expect(series).toContain('Break Hours');
    });

    it('renders with height 300', () => {
        const { getByTestId } = render(<StudyHoursChart data={mockData} />);
        expect(getByTestId('line-chart').getAttribute('data-height')).toBe('300');
    });

    it('renders in dark mode', () => {
        useTheme.mockReturnValue({ theme: 'dark' });
        const { getByTestId } = render(<StudyHoursChart data={mockData} />);
        expect(getByTestId('line-chart')).toBeTruthy();
    });
});
