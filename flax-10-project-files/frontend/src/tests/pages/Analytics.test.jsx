import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../utils/testUtils';
import { MemoryRouter } from 'react-router-dom';

vi.mock('framer-motion', () => ({
    motion: new Proxy({}, {
        get: (_, tag) => ({ children, ...props }) => {
            const Tag = typeof tag === 'string' ? tag : 'div';
            const { initial, animate, exit, transition, variants, custom, ...rest } = props;
            return <Tag {...rest}>{children}</Tag>;
        },
    }),
    AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('../../api/analyticsApi', () => ({
    default: {
        getSummary: vi.fn().mockResolvedValue({
            summary: {
                total_study_hours: 10,
                total_sessions: 5,
                avg_session_minutes: 30,
                current_streak_days: 2,
                longest_session_minutes: 60,
                active_days: 4,
            },
            period_days: 30,
        }),
        getProgress: vi.fn().mockResolvedValue({}),
        getThemeStats: vi.fn().mockResolvedValue({}),
    },
}));

vi.mock('../../components/analytics/components/SummaryCards', () => ({
    default: ({ data }) => <div data-testid="summary-cards">{data ? 'loaded' : 'no-data'}</div>,
}));

vi.mock('../../components/analytics/components/ProductivityCards', () => ({
    default: () => <div data-testid="productivity-cards" />,
}));

vi.mock('../../components/analytics/components/StudyHoursChart', () => ({
    default: () => <div data-testid="study-hours-chart" />,
}));

vi.mock('../../components/analytics/components/DailyBreakdownChart', () => ({
    default: () => <div data-testid="daily-breakdown-chart" />,
}));

vi.mock('../../components/analytics/components/StudyHeatmap', () => ({
    default: () => <div data-testid="study-heatmap" />,
}));

vi.mock('../../components/analytics/components/AttendanceChart', () => ({
    default: () => <div data-testid="attendance-chart" />,
}));

vi.mock('../../components/analytics/components/PlannedVsActualChart', () => ({
    default: () => <div data-testid="planned-vs-actual-chart" />,
}));

vi.mock('../../components/analytics/components/ThemeUsageChart', () => ({
    default: () => <div data-testid="theme-usage-chart" />,
}));

vi.mock('../../components/analytics/components/AIInsightsTab', () => ({
    default: () => <div data-testid="ai-insights-tab" />,
}));

vi.mock('../../components/analytics/components/InsightCards', () => ({
    ConsistencyScore: () => <div data-testid="consistency-score" />,
    PeakHoursCard: () => <div data-testid="peak-hours-card" />,
}));

import AnalyticsPage from '../../pages/analytics/AnalyticsPage';
import analyticsService from '../../api/analyticsApi';

describe('AnalyticsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders page title', async () => {
        render(<MemoryRouter><AnalyticsPage /></MemoryRouter>);
        await waitFor(() => expect(screen.getAllByText('Analytics').length).toBeGreaterThan(0));
    });

    it('renders period toggle buttons', async () => {
        render(<MemoryRouter><AnalyticsPage /></MemoryRouter>);
        await waitFor(() => screen.getAllByText('Analytics'));
        expect(screen.getByText('7d')).toBeTruthy();
        expect(screen.getByText('30d')).toBeTruthy();
        expect(screen.getByText('90d')).toBeTruthy();
    });

    it('renders tab buttons', async () => {
        render(<MemoryRouter><AnalyticsPage /></MemoryRouter>);
        await waitFor(() => screen.getAllByText('Analytics'));
        expect(screen.getByText(/Overview/)).toBeTruthy();
        expect(screen.getByText(/AI Insights/)).toBeTruthy();
    });

    it('shows loading state then renders summary cards', async () => {
        render(<MemoryRouter><AnalyticsPage /></MemoryRouter>);
        await waitFor(() => expect(screen.getByTestId('summary-cards')).toBeTruthy());
    });

    it('shows error message when fetch fails', async () => {
        analyticsService.getSummary.mockRejectedValueOnce(new Error('Network error'));
        analyticsService.getProgress.mockRejectedValueOnce(new Error('fail'));
        analyticsService.getThemeStats.mockRejectedValueOnce(new Error('fail'));
        render(<MemoryRouter><AnalyticsPage /></MemoryRouter>);
        await waitFor(() => expect(screen.getByText(/Network error/)).toBeTruthy());
    });

    it('switches to AI Insights tab', async () => {
        render(<MemoryRouter><AnalyticsPage /></MemoryRouter>);
        await waitFor(() => screen.getByText(/AI Insights/));
        fireEvent.click(screen.getByText(/AI Insights/));
        await waitFor(() => expect(screen.getByTestId('ai-insights-tab')).toBeTruthy());
    });

    it('refetches when period changes', async () => {
        render(<MemoryRouter><AnalyticsPage /></MemoryRouter>);
        await screen.findByTestId('summary-cards');
        fireEvent.click(screen.getByText('7d'));
        await waitFor(() => expect(analyticsService.getSummary).toHaveBeenCalledWith(7));
    });

    it('refetches with 90d when 90d period clicked', async () => {
        render(<MemoryRouter><AnalyticsPage /></MemoryRouter>);
        await screen.findByTestId('summary-cards');
        fireEvent.click(screen.getByText('90d'));
        await waitFor(() => expect(analyticsService.getSummary).toHaveBeenCalledWith(90));
    });

    it('shows generic error when fetch fails without message', async () => {
        analyticsService.getSummary.mockRejectedValueOnce({});
        analyticsService.getProgress.mockRejectedValueOnce({});
        analyticsService.getThemeStats.mockRejectedValueOnce({});
        render(<MemoryRouter><AnalyticsPage /></MemoryRouter>);
        await waitFor(() => expect(screen.getByText(/Failed to load analytics data/)).toBeTruthy());
    });

    it('shows the no-sessions empty state and dispatches navigation to timer', async () => {
        analyticsService.getSummary.mockResolvedValueOnce({
            summary: {
                total_study_hours: 0,
                total_sessions: 0,
                avg_session_minutes: 0,
                current_streak_days: 0,
                longest_session_minutes: 0,
                active_days: 0,
            },
            period_days: 30,
        });
        analyticsService.getProgress.mockResolvedValueOnce({});
        analyticsService.getThemeStats.mockResolvedValueOnce({});
        const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

        render(<MemoryRouter><AnalyticsPage /></MemoryRouter>);

        await waitFor(() => expect(screen.getByText('No study data yet')).toBeTruthy());
        fireEvent.click(screen.getByText('Open Timer'));
        expect(dispatchEventSpy).toHaveBeenCalledWith(expect.objectContaining({
            type: 'navigate',
            detail: 'timer',
        }));
    });
});
