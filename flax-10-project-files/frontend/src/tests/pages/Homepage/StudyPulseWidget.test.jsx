import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('framer-motion', () => ({
    motion: new Proxy({}, {
        get: (_, tag) => ({ children, ...props }) => {
            const Tag = typeof tag === 'string' ? tag : 'div';
            const { initial, animate, transition, ...rest } = props;
            return <Tag {...rest}>{children}</Tag>;
        },
    }),
    AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('../../../pages/Profile/hooks/useProfileSummary', () => ({
    useProfileSummary: vi.fn(() => ({
        summary: {
            weekly: { percentage: 60, hours_studied: 6, goal_hours: 10 },
            streaks: { current: 3 },
        },
        loading: false,
    })),
}));

vi.mock('../../../api/analyticsService', () => ({
    default: { getSummary: vi.fn().mockResolvedValue(null) },
}));

import { StudyPulseWidget } from '../../../pages/Homepage/components/StudyPulseWidget';

function renderWidget(props = {}) {
    return render(
        <MemoryRouter>
            <StudyPulseWidget {...props} />
        </MemoryRouter>
    );
}

describe('StudyPulseWidget', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders Study Pulse heading', () => {
        renderWidget();
        expect(screen.getByText('Study Pulse')).toBeTruthy();
    });

    it('renders the weekly progress ring', () => {
        renderWidget();
        expect(screen.getByText('60%')).toBeTruthy();
    });

    it('renders hours studied', () => {
        renderWidget();
        expect(screen.getByText(/6h/)).toBeTruthy();
    });

    it('renders the 7 day labels', () => {
        renderWidget();
        // At least M, T, W present
        const text = document.body.textContent;
        expect(text).toContain('M');
        expect(text).toContain('W');
        expect(text).toContain('F');
    });

    it('renders streak chip', () => {
        renderWidget();
        // streak chip shows "-day streak" text (multiple streak-related elements may exist)
        expect(screen.getAllByText(/streak/i).length).toBeGreaterThan(0);
    });

    it('renders view analytics link', () => {
        renderWidget();
        expect(screen.getByText('View analytics')).toBeTruthy();
    });
});
