import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TinyGapRow } from '../../../../pages/homepage/components/mini_timeline/TinyGapRow';

const mockStyles = {
    planTimelineRow: 'planTimelineRow',
    planTimelineRowGap: 'planTimelineRowGap',
    planTimelineGutter: 'planTimelineGutter',
    planTimelineTime: 'planTimelineTime',
    planTimelineSpineCell: 'planTimelineSpineCell',
    planTimelineGapShortWindow: 'planTimelineGapShortWindow',
    planTimelineGapShortWindowNoActions: 'planTimelineGapShortWindowNoActions',
    planTimelineGapRail: 'planTimelineGapRail',
    planTimelineGapMain: 'planTimelineGapMain',
    planTimelineGapLeadDot: 'planTimelineGapLeadDot',
    planTimelineGapShortDur: 'planTimelineGapShortDur',
    planTimelineGapSeparator: 'planTimelineGapSeparator',
    planTimelineGapNoTasks: 'planTimelineGapNoTasks',
};

describe('TinyGapRow', () => {
    it('shows minutes free text from row.minutes', () => {
        const row = { id: 1, minutes: 20, startMins: 60, endMins: 80, spacingBeforePx: 0 };
        render(<TinyGapRow row={row} styles={mockStyles} />);
        expect(screen.getByText('20m free')).toBeTruthy();
    });

    it('shows minutes free calculated from startMins/endMins when minutes not provided', () => {
        const row = { id: 1, startMins: 60, endMins: 90, spacingBeforePx: 0 };
        render(<TinyGapRow row={row} styles={mockStyles} />);
        expect(screen.getByText('30m free')).toBeTruthy();
    });

    it('shows time in HH:MM format', () => {
        const row = { id: 1, minutes: 15, startMins: 60, endMins: 75, spacingBeforePx: 0 };
        render(<TinyGapRow row={row} styles={mockStyles} />);
        // DAY_START_HOUR + 60/60 = start hour + 1 = "07:00" (assuming DAY_START_HOUR=6)
        const timeEl = screen.getByText(/^\d{2}:\d{2}$/);
        expect(timeEl).toBeTruthy();
    });

    it('shows Reset text', () => {
        const row = { id: 1, minutes: 10, startMins: 0, spacingBeforePx: 0 };
        render(<TinyGapRow row={row} styles={mockStyles} />);
        expect(screen.getByText('Reset')).toBeTruthy();
    });

    it('applies spacing before via marginTop style', () => {
        const row = { id: 1, minutes: 10, startMins: 0, spacingBeforePx: 16 };
        const { container } = render(<TinyGapRow row={row} styles={mockStyles} />);
        const rowEl = container.firstChild;
        expect(rowEl.style.marginTop).toBe('16px');
    });

    it('handles 0 minutes with minimum height', () => {
        const row = { id: 1, minutes: 0, startMins: 60, endMins: 60, spacingBeforePx: 0 };
        const { container } = render(<TinyGapRow row={row} styles={mockStyles} />);
        const rowEl = container.firstChild;
        expect(rowEl.style.minHeight).toBe('24px');
    });
});
