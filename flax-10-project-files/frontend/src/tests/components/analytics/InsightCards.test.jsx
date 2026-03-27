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

<<<<<<< HEAD:flax-10-project-files/frontend/src/tests/components/analytics/InsightCards.test.jsx
import { ConsistencyScore, PeakHoursCard } from '../../../components/analytics/components/InsightCards';
=======
import { ConsistencyScore, PeakHoursCard } from '../../../components/analytics/InsightCards';
>>>>>>> main:flax-10-project-files/frontend/src/tests/components/Analytics/InsightCards.test.jsx

const mockData = {
    summary: {
        current_streak_days: 5,
        active_days: 20,
    },
    period_days: 30,
    heatmap: {
        data: [[10, 0, 5], [0, 15, 0]],
        hours: [9, 10, 11],
    },
};

describe('ConsistencyScore', () => {
    it('returns null when data has no summary', () => {
        const { container } = render(<ConsistencyScore data={{}} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders Consistency label', () => {
        render(<ConsistencyScore data={mockData} />);
        expect(screen.getByText('Consistency')).toBeTruthy();
    });

    it('renders score out of 100', () => {
        render(<ConsistencyScore data={mockData} />);
        expect(screen.getByText('/100')).toBeTruthy();
    });

    it('renders score label', () => {
        render(<ConsistencyScore data={mockData} />);
        // Score label: Excellent/Good/Building/Getting Started
        const labels = ['Excellent', 'Good', 'Building', 'Getting Started'];
        const found = labels.some(l => screen.queryByText(l));
        expect(found).toBe(true);
    });

    it('renders explanation text', () => {
        const { container } = render(<ConsistencyScore data={mockData} />);
        expect(container.firstChild).toHaveAttribute('data-tooltip', expect.stringMatching(/Studied \d+ of \d+ days/));
    });
});

describe('PeakHoursCard', () => {
    it('returns null when data has no heatmap', () => {
        const { container } = render(<PeakHoursCard data={{}} />);
        expect(container.firstChild).toBeNull();
    });

    it('returns null when grid or hours are not arrays', () => {
        const { container } = render(<PeakHoursCard data={{ heatmap: { data: null, hours: null } }} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders Peak Hours label', () => {
        render(<PeakHoursCard data={mockData} />);
        expect(screen.getByText('Peak Hours')).toBeTruthy();
    });

    it('renders top hours in 12h format', () => {
        render(<PeakHoursCard data={mockData} />);
        // Hours 9, 10, and 11 should render as 9am, 10am, and 11am.
        expect(screen.getByText('10am')).toBeTruthy();
    });

    it('shows no data message when no heatmap data', () => {
        render(<PeakHoursCard data={{ heatmap: { data: [[0, 0]], hours: [9, 10] } }} />);
        expect(screen.getByText('No peak-hour data yet')).toBeTruthy();
    });

    it('renders rank badges for top hours', () => {
        render(<PeakHoursCard data={mockData} />);
        expect(screen.getByText('#1')).toBeTruthy();
    });
});
