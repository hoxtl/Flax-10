import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../../../../pages/homepage/utils/dateFormatUtils', () => ({
    formatHour12h: vi.fn((h) => `${h}:00`),
}));

import { HourMarkRow } from '../../../../pages/homepage/components/mini_timeline/HourMarkRow';

const mockStyles = {
    planTimelineHourMark: 'hourMark',
    planTimelineHourMarkLabel: 'label',
    planTimelineHourMarkDot: 'dot',
    planTimelineHourMarkLine: 'line',
};

describe('HourMarkRow', () => {
    it('renders hour label', () => {
        render(<HourMarkRow row={{ id: '9', hour: 9 }} styles={mockStyles} />);
        expect(screen.getByText('9:00')).toBeTruthy();
    });

    it('renders dot and line aria-hidden', () => {
        const { container } = render(<HourMarkRow row={{ id: '10', hour: 10 }} styles={mockStyles} />);
        const hidden = container.querySelectorAll('[aria-hidden]');
        expect(hidden.length).toBe(2);
    });
});
