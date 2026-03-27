import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('@mui/x-charts/BarChart', () => ({
    BarChart: ({ series, height }) => (
        <div data-testid="bar-chart" data-series={JSON.stringify(series.map(s => s.label))} data-height={height} />
    ),
}));

vi.mock('../../../context/ThemeContext', () => ({
    useTheme: vi.fn(() => ({ theme: 'light' })),
}));

<<<<<<< HEAD:flax-10-project-files/frontend/src/tests/components/analytics/DailyBreakdownChart.test.jsx
import DailyBreakdownChart from '../../../components/analytics/components/DailyBreakdownChart';
=======
import DailyBreakdownChart from '../../../components/analytics/DailyBreakdownChart';
>>>>>>> main:flax-10-project-files/frontend/src/tests/components/Analytics/DailyBreakdownChart.test.jsx

const mockData = [
    { date: '2024-03-01', work: 90, break: 20 },
    { date: '2024-03-02', work: 60, break: 15 },
    { date: '2024-03-03', work: 120, break: 30 },
];

describe('DailyBreakdownChart', () => {
    it('renders without crashing', () => {
        const { getByTestId } = render(<DailyBreakdownChart data={mockData} />);
        expect(getByTestId('bar-chart')).toBeTruthy();
    });

    it('passes Work and Break series labels', () => {
        const { getByTestId } = render(<DailyBreakdownChart data={mockData} />);
        const series = JSON.parse(getByTestId('bar-chart').getAttribute('data-series'));
        expect(series).toContain('Work (min)');
        expect(series).toContain('Break (min)');
    });

    it('uses custom height when provided', () => {
        const { getByTestId } = render(<DailyBreakdownChart data={mockData} height={200} />);
        expect(getByTestId('bar-chart').getAttribute('data-height')).toBe('200');
    });

    it('handles null data gracefully', () => {
        const { getByTestId } = render(<DailyBreakdownChart data={null} />);
        expect(getByTestId('bar-chart')).toBeTruthy();
    });

    it('uses sage color theme when theme prop is sage', () => {
        const { getByTestId } = render(<DailyBreakdownChart data={mockData} theme="sage" />);
        expect(getByTestId('bar-chart')).toBeTruthy();
    });
});
