import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('framer-motion', () => ({
    motion: new Proxy({}, {
        get: (_, tag) => ({ children, ...props }) => {
            const Tag = typeof tag === 'string' ? tag : 'div';
            const { initial, animate, exit, transition, ...rest } = props;
            return <Tag {...rest}>{children}</Tag>;
        },
    }),
    AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('react-markdown', () => ({
    default: ({ children }) => <div data-testid="markdown">{children}</div>,
}));

vi.mock('remark-gfm', () => ({ default: () => {} }));

vi.mock('../../../api/analyticsService', () => ({
    default: {
        getAiInsights: vi.fn().mockResolvedValue({ insights: 'You study well!' }),
        chatWithInsights: vi.fn().mockResolvedValue({ response: 'Great question!' }),
    },
}));

import AIInsightsTab, { InsightsPanel } from '../../../components/Analytics/AIInsightsTab';
import analyticsService from '../../../api/analyticsService';

// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

describe('InsightsPanel', () => {
    it('renders generate button in non-compact mode', () => {
        render(<InsightsPanel insights={null} loading={false} onGenerate={vi.fn()} period={30} />);
        expect(screen.getByText(/Generate/)).toBeTruthy();
    });

    it('hides header in compact mode', () => {
        render(<InsightsPanel insights={null} loading={false} onGenerate={vi.fn()} period={30} compact={true} />);
        expect(screen.queryByText('Study Analysis')).toBeNull();
    });

    it('shows spinner when loading', () => {
        render(<InsightsPanel insights={null} loading={true} onGenerate={vi.fn()} period={30} />);
        expect(screen.getByText(/Analysing your study patterns/)).toBeTruthy();
    });

    it('renders insights markdown when available', () => {
        render(<InsightsPanel insights="You study 2h/day" loading={false} onGenerate={vi.fn()} period={30} />);
        expect(screen.getByTestId('markdown')).toBeTruthy();
    });

    it('calls onGenerate when button clicked', () => {
        const onGenerate = vi.fn();
        render(<InsightsPanel insights={null} loading={false} onGenerate={onGenerate} period={30} />);
        fireEvent.click(screen.getByText(/Generate/));
        expect(onGenerate).toHaveBeenCalledOnce();
    });
});

describe('AIInsightsTab', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders without crashing', () => {
        const { container } = render(<AIInsightsTab period={30} />);
        expect(container.firstChild).toBeTruthy();
    });

    it('generates insights when Generate button clicked', async () => {
        render(<AIInsightsTab period={30} />);
        fireEvent.click(screen.getAllByText(/Generate/)[0]);
        await waitFor(() => expect(analyticsService.getAiInsights).toHaveBeenCalledWith(30));
    });

    it('shows insights after generation', async () => {
        render(<AIInsightsTab period={30} />);
        fireEvent.click(screen.getAllByText(/Generate/)[0]);
        await waitFor(() => expect(screen.getAllByTestId('markdown').length).toBeGreaterThan(0));
    });
});
