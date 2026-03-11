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

vi.mock('../../../pages/Homepage/components/RightNowWidget', () => ({
    RightNowWidget: () => <div data-testid="right-now-widget" />,
}));

vi.mock('../../../pages/Homepage/components/QuickActionsWidget', () => ({
    QuickActionsWidget: () => <div data-testid="quick-actions-widget" />,
}));

vi.mock('../../../pages/Homepage/components/SocialDiscoverWidget', () => ({
    SocialDiscoverWidget: () => <div data-testid="social-discover-widget" />,
}));

vi.mock('../../../pages/Homepage/components/StudyPulseWidget', () => ({
    StudyPulseWidget: () => <div data-testid="study-pulse-widget" />,
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

    it('renders RightNowWidget', () => {
        renderRow();
        expect(screen.getByTestId('right-now-widget')).toBeTruthy();
    });

    it('renders QuickActionsWidget', () => {
        renderRow();
        expect(screen.getByTestId('quick-actions-widget')).toBeTruthy();
    });

    it('renders StudyPulseWidget', () => {
        renderRow();
        expect(screen.getByTestId('study-pulse-widget')).toBeTruthy();
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
        await waitFor(() => expect(screen.getByTestId('right-now-widget')).toBeTruthy());
    });

    it('handles TfL getTfLDelays returning non-array', async () => {
        const { tflService } = await import('../../../api/tflService');
        tflService.getTfLDelays.mockResolvedValueOnce({ data: [] });
        renderRow();
        await waitFor(() => expect(screen.getByTestId('right-now-widget')).toBeTruthy());
    });
});
