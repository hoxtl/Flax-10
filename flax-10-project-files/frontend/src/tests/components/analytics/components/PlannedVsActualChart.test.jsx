import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('@mui/x-charts/BarChart', () => ({
    BarChart: ({ series, height }) => (
        <div data-testid="bar-chart" data-series={JSON.stringify(series.map(s => s.label))} data-height={height} />
    ),
}));

vi.mock('../../../../context/ThemeContext', () => ({
    useTheme: vi.fn(() => ({ theme: 'light' })),
}));

import PlannedVsActualChart from '../../../../components/analytics/components/PlannedVsActualChart';

const mockData = [
    { date: '2024-03-01', planned_hours: 2, actual_hours: 1.5 },
    { date: '2024-03-02', planned_hours: 3, actual_hours: 2.8 },
];

describe('PlannedVsActualChart', () => {
    it('renders without crashing', () => {
        const { getByTestId } = render(<PlannedVsActualChart data={mockData} />);
        expect(getByTestId('bar-chart')).toBeTruthy();
    });

    it('renders Planned and Actual series', () => {
        const { getByTestId } = render(<PlannedVsActualChart data={mockData} />);
        const series = JSON.parse(getByTestId('bar-chart').getAttribute('data-series'));
        expect(series).toContain('Planned (hrs)');
        expect(series).toContain('Actual (hrs)');
    });

    it('handles empty data gracefully', () => {
        const { getByTestId } = render(<PlannedVsActualChart data={[]} />);
        expect(getByTestId('bar-chart')).toBeTruthy();
    });

    it('handles undefined data gracefully', () => {
        const { getByTestId } = render(<PlannedVsActualChart />);
        expect(getByTestId('bar-chart')).toBeTruthy();
    });

    it('renders warm variant', () => {
        const { getByTestId } = render(<PlannedVsActualChart data={mockData} variant="warm" />);
        expect(getByTestId('bar-chart')).toBeTruthy();
    });
});
