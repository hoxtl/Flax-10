import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('framer-motion', () => ({
    motion: new Proxy({}, {
        get: (_, tag) => ({ children, ...props }) => {
            const Tag = typeof tag === 'string' ? tag : 'div';
            return <Tag {...props}>{children}</Tag>;
        },
    }),
    AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('../../../api/tflService', () => ({
    tflService: { getTfLDelays: vi.fn().mockResolvedValue([]) },
}));

vi.mock('../../../pages/Profile/hooks/useProfileSummary', () => ({
    useProfileSummary: vi.fn(() => ({
        summary: {
            weekly: { percentage: 72 },
            streaks: { current: 3 },
        },
        loading: false,
    })),
}));

vi.mock('../../../components/ui/bento-grid', () => ({
    BentoGrid: ({ children }) => <div data-testid="bento-grid">{children}</div>,
    BentoCard: ({ children, className }) => <div data-testid="bento-card" className={className}>{children}</div>,
}));

import IntelligenceRow from '../../../pages/Homepage/components/IntelligenceRow';

function renderRow(props = {}) {
    return render(
        <MemoryRouter>
            <IntelligenceRow {...props} />
        </MemoryRouter>
    );
}

describe('IntelligenceRow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the bento grid', () => {
        renderRow();
        expect(screen.getByTestId('bento-grid')).toBeTruthy();
    });

    it('renders live context summary in the banner', () => {
        renderRow();
        expect(screen.getByText(/breathing room|up next|on now|travel|attention/i)).toBeTruthy();
    });

    it('renders analytics summary in the banner', () => {
        renderRow();
        expect(screen.getByText(/weekly goal/i)).toBeTruthy();
        expect(screen.getByText(/streak/i)).toBeTruthy();
    });

    it('renders slot1TodayTasks content', () => {
        renderRow({ slot1TodayTasks: <div data-testid="today-tasks">Tasks</div> });
        expect(screen.getByTestId('today-tasks')).toBeTruthy();
    });

    it('renders slot3Urgent content', () => {
        renderRow({ slot3Urgent: <div data-testid="urgent">Urgent</div> });
        expect(screen.getByTestId('urgent')).toBeTruthy();
    });

    it('renders greeting with displayName', () => {
        renderRow({ displayName: 'Alice' });
        expect(screen.getByText(/Alice/)).toBeTruthy();
    });

    it('renders greeting without displayName', () => {
        renderRow({ displayName: undefined });
        // greeting should contain "Good" but no name
        const text = screen.getByText(/^Good (Morning|Afternoon|Evening)\.$/);
        expect(text).toBeTruthy();
    });

    it('handles TfL getTfLDelays rejection', async () => {
        const { tflService } = await import('../../../api/tflService');
        tflService.getTfLDelays.mockRejectedValueOnce(new Error('Network error'));
        renderRow();
        await waitFor(() => expect(screen.getByText(/breathing room|up next|on now|travel|attention/i)).toBeTruthy());
    });

    it('handles TfL getTfLDelays returning non-array', async () => {
        const { tflService } = await import('../../../api/tflService');
        tflService.getTfLDelays.mockResolvedValueOnce({ data: [] });
        renderRow();
        await waitFor(() => expect(screen.getByText(/breathing room|up next|on now|travel|attention/i)).toBeTruthy());
    });

    it('shows event-specific TfL warning for the next KCL event', async () => {
        const { tflService } = await import('../../../api/tflService');
        tflService.getTfLDelays.mockResolvedValueOnce([
            { lineName: 'Northern', severityDescription: 'Minor delays' },
        ]);
        const start = new Date(Date.now() + 60 * 60 * 1000);
        const end = new Date(Date.now() + 2 * 60 * 60 * 1000);
        const kclEvent = { id: 1, title: 'Algorithms Lecture', location: 'Strand Campus',
            start_time: start.toISOString(), end_time: end.toISOString() };
        renderRow({ slot5Data: { now: new Date(), sortedEvents: [kclEvent] } });
        await waitFor(() => {
            expect(screen.getByText(/you may be late for your/i)).toBeTruthy();
            expect(screen.getByText(/Algorithms Lecture/)).toBeTruthy();
        });
    });
});
