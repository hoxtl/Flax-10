import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../../../context/ThemeContext', () => ({
    useTheme: vi.fn(() => ({ theme: 'light' })),
}));

import StudyHeatmap from '../../../components/analytics/components/StudyHeatmap';
import { useTheme } from '../../../context/ThemeContext';

const mockHeatmapData = {
    data: [
        [0, 1, 2, 1, 0, 2, 1],
        [3, 0, 1, 2, 1, 0, 1],
    ],
    days: ['Mon', 'Tue'],
    // When i % 3 === 0, indices 0, 3, and 6 map to hours 0, 12, and 18.
    hours: [0, 4, 8, 12, 16, 20, 18],
};

describe('StudyHeatmap', () => {
    it('renders without crashing', () => {
        const { container } = render(<StudyHeatmap heatmapData={mockHeatmapData} />);
        expect(container.firstChild).toBeTruthy();
    });

    it('renders day labels', () => {
        render(<StudyHeatmap heatmapData={mockHeatmapData} />);
        expect(screen.getByText('Mon')).toBeTruthy();
        expect(screen.getByText('Tue')).toBeTruthy();
    });

    it('renders hour labels (every 3 hours)', () => {
        render(<StudyHeatmap heatmapData={mockHeatmapData} />);
        expect(screen.getByText('12am')).toBeTruthy();
        expect(screen.getByText('12pm')).toBeTruthy();
    });

    it('renders in dark mode without crashing', () => {
        useTheme.mockReturnValue({ theme: 'dark' });
        const { container } = render(<StudyHeatmap heatmapData={mockHeatmapData} />);
        expect(container.firstChild).toBeTruthy();
    });
});
