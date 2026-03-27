import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@mui/x-charts/PieChart', () => ({
    PieChart: ({ series }) => (
        <div data-testid="pie-chart" data-series={JSON.stringify(series)} />
    ),
}));

<<<<<<< HEAD:flax-10-project-files/frontend/src/tests/components/analytics/ThemeUsageChart.test.jsx
import ThemeUsageChart from '../../../components/analytics/components/ThemeUsageChart';
=======
import ThemeUsageChart from '../../../components/analytics/ThemeUsageChart';
>>>>>>> main:flax-10-project-files/frontend/src/tests/components/Analytics/ThemeUsageChart.test.jsx

describe('ThemeUsageChart', () => {
    it('shows Night Owl badge when dark >= 60%', () => {
        render(<ThemeUsageChart themeStats={{
            summary: { dark_percentage: 70, light_percentage: 30, dark_minutes: 420, light_minutes: 180 },
        }} />);
        expect(screen.getByText('🦉 Night Owl')).toBeTruthy();
    });

    it('shows Mixed badge when dark 30-60%', () => {
        render(<ThemeUsageChart themeStats={{
            summary: { dark_percentage: 45, light_percentage: 55, dark_minutes: 270, light_minutes: 330 },
        }} />);
        expect(screen.getByText('🌗 Mixed')).toBeTruthy();
    });

    it('shows Day Worker badge when dark < 30%', () => {
        render(<ThemeUsageChart themeStats={{
            summary: { dark_percentage: 10, light_percentage: 90, dark_minutes: 60, light_minutes: 540 },
        }} />);
        expect(screen.getByText('☀️ Day Worker')).toBeTruthy();
    });

    it('shows peak dark hour when provided', () => {
        render(<ThemeUsageChart themeStats={{
            summary: { dark_percentage: 70, light_percentage: 30, dark_minutes: 420, light_minutes: 180, peak_dark_hour: '10pm' },
        }} />);
        expect(screen.getByText(/Peak dark mode: 10pm/)).toBeTruthy();
    });

    it('renders PieChart', () => {
        render(<ThemeUsageChart themeStats={{
            summary: { dark_percentage: 50, light_percentage: 50, dark_minutes: 300, light_minutes: 300 },
        }} />);
        expect(screen.getByTestId('pie-chart')).toBeTruthy();
    });
});
