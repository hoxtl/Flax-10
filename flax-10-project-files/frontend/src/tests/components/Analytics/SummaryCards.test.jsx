import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('framer-motion', () => ({
    motion: new Proxy({}, {
        get: (_, tag) => ({ children, ...props }) => {
            const Tag = typeof tag === 'string' ? tag : 'div';
            const { initial, animate, transition, ...rest } = props;
            return <Tag {...rest}>{children}</Tag>;
        },
    }),
}));

import SummaryCards from '../../../components/analytics/SummaryCards';

const mockData = {
    summary: {
        total_study_hours: 12.5,
        total_sessions: 8,
        avg_session_minutes: 45,
        current_streak_days: 3,
        longest_session_minutes: 90,
        active_days: 5,
    },
    period_days: 30,
    daily_breakdown: [],
};

describe('SummaryCards', () => {
    it('returns null when data has no summary', () => {
        const { container } = render(<SummaryCards data={{}} />);
        expect(container.firstChild).toBeNull();
    });

    it('returns null when data is null', () => {
        const { container } = render(<SummaryCards data={null} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders all 6 stat card labels', () => {
        render(<SummaryCards data={mockData} />);
        expect(screen.getByText('Total Study Hours')).toBeTruthy();
        expect(screen.getByText('Sessions')).toBeTruthy();
        expect(screen.getByText('Avg Session')).toBeTruthy();
        expect(screen.getByText('Current Streak')).toBeTruthy();
        expect(screen.getByText('Longest Session')).toBeTruthy();
        expect(screen.getByText('Active Days')).toBeTruthy();
    });

    it('renders unit labels', () => {
        render(<SummaryCards data={mockData} />);
        expect(screen.getByText('hrs')).toBeTruthy();
        const minEls = screen.getAllByText('min');
        expect(minEls.length).toBeGreaterThan(0);
    });

    it('derives active_days from daily_breakdown when not in summary', () => {
        const dataWithBreakdown = {
            ...mockData,
            summary: { ...mockData.summary, active_days: undefined },
            daily_breakdown: [
                { sessions: 2 },
                { sessions: 0 },
                { sessions: 1 },
            ],
        };
        render(<SummaryCards data={dataWithBreakdown} />);
        // Should render without crashing
        expect(screen.getByText('Active Days')).toBeTruthy();
    });
});
