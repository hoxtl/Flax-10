import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
<<<<<<< HEAD:flax-10-project-files/frontend/src/tests/components/analytics/ProductivityCards.test.jsx
import ProductivityCards from '../../../components/analytics/components/ProductivityCards';
=======
import ProductivityCards from '../../../components/analytics/ProductivityCards';
>>>>>>> main:flax-10-project-files/frontend/src/tests/components/Analytics/ProductivityCards.test.jsx

const mockData = {
    summary: {
        work_break_ratio: 3.5,
        overtime_sessions: 2,
        longest_session_minutes: 90,
        planning_completion_rate: 85,
    },
};

const mockProgressData = {
    summary: {
        adherence_percentage: 78,
    },
};

describe('ProductivityCards', () => {
    it('returns null when data is null', () => {
        const { container } = render(<ProductivityCards data={null} />);
        expect(container.firstChild).toBeNull();
    });

    it('returns null when data.summary is null', () => {
        const { container } = render(<ProductivityCards data={{ summary: null }} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders Work / Break Ratio card', () => {
        render(<ProductivityCards data={mockData} progressData={mockProgressData} />);
        expect(screen.getByText('Work / Break Ratio')).toBeTruthy();
        expect(screen.getByText('3.5:1')).toBeTruthy();
    });

    it('renders Overtime Sessions card', () => {
        render(<ProductivityCards data={mockData} progressData={mockProgressData} />);
        expect(screen.getByText('Overtime Sessions')).toBeTruthy();
        expect(screen.getByText('2')).toBeTruthy();
    });

    it('renders Schedule Adherence with percentage', () => {
        render(<ProductivityCards data={mockData} progressData={mockProgressData} />);
        expect(screen.getByText('Schedule Adherence')).toBeTruthy();
        expect(screen.getByText('78')).toBeTruthy();
        expect(screen.getAllByText('%').length).toBeGreaterThan(0);
    });

    it('shows — for null ratio', () => {
        const dataWithNullRatio = { summary: { ...mockData.summary, work_break_ratio: null } };
        render(<ProductivityCards data={dataWithNullRatio} progressData={mockProgressData} />);
        expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    });
});
