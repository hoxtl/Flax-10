import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
import analyticsService from '../../../api/analyticsService';
import { useProfileSummary } from '../../../pages/Profile/hooks/useProfileSummary';

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

    it('renders streak-at-risk insight in the afternoon with no study today', async () => {
        useProfileSummary.mockReturnValueOnce({
            summary: { weekly: { percentage: 60, hours_studied: 0, goal_hours: 10 }, streaks: { current: 3 } },
            loading: false,
        });

        renderWidget({ now: new Date('2026-03-09T15:00:00Z') });
        expect(screen.getByText(/streak at risk/i)).toBeTruthy();
    });

    it('renders urgent deadline insight when goal pct is below 70', async () => {
        useProfileSummary.mockReturnValueOnce({
            summary: { weekly: { percentage: 60, hours_studied: 1, goal_hours: 10 }, streaks: { current: 0 } },
            loading: false,
        });
        const deadlines = [{ start_due_date: '2026-03-12T10:00:00Z', assessment_title: 'Coursework 1', module_code: 'CS3001' }];

        renderWidget({ now: new Date('2026-03-09T10:00:00Z'), deadlines });
        expect(screen.getByText(/due in/i)).toBeTruthy();
    });

    it('renders next focus window details when windows are provided', async () => {
        analyticsService.getSummary.mockResolvedValueOnce(null);
        const now = new Date('2026-03-09T10:00:00Z');
        const windows = [{
            start: new Date('2026-03-09T15:00:00Z'),
            end: new Date('2026-03-09T16:00:00Z'),
            minutes: 60,
        }];
        renderWidget({ now, windows });
        expect(screen.getByText('Next focus window')).toBeTruthy();
        // en-GB time format, 24h
        expect(document.body.textContent).toMatch(/15:00\s*–\s*16:00/);
        expect(screen.getByText('1h')).toBeTruthy();
    });

    it('shows empty focus window state when no windows left', () => {
        renderWidget({ windows: [] });
        expect(screen.getByText('No free windows left today')).toBeTruthy();
    });
});
