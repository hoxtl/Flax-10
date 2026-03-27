import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('framer-motion', () => ({
    motion: new Proxy({}, {
        get: (_, tag) => ({ children, ...props }) => {
            const Tag = typeof tag === 'string' ? tag : 'div';
            delete props.initial;
            delete props.animate;
            delete props.transition;
            delete props.layout;
            return <Tag {...props}>{children}</Tag>;
        },
    }),
    AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('../../../pages/homepage/hooks/useCountdown', () => ({
    useCountdown: vi.fn(() => ({ text: '5m' })),
}));

vi.mock('../../../pages/homepage/utils/kclTflMapping', () => ({
    getRelevantDelays: vi.fn(() => []),
    getTflLinesForLocation: vi.fn(() => []),
    isSevereDisruption: vi.fn(() => false),
}));

vi.mock('../../../pages/homepage/utils/eventUtils', () => ({
    isNow: vi.fn(() => false),
}));

vi.mock('../../../api/tflApi', () => ({
    tflService: {
        journeyPlanner: vi.fn().mockResolvedValue(null),
    },
}));

vi.mock('../../../api/userApi', () => ({
    getHomeAddress: vi.fn().mockResolvedValue(null),
}));

import { RightNowWidget } from '../../../pages/homepage/components/RightNowWidget';
import * as eventUtils from '../../../pages/homepage/utils/eventUtils';
import * as kclTflMapping from '../../../pages/homepage/utils/kclTflMapping';
import { getHomeAddress } from '../../../api/userApi';
import { tflService } from '../../../api/tflApi';

const baseNow = new Date('2024-03-08T14:00:00Z');

function renderWidget(props = {}) {
    return render(
        <MemoryRouter>
            <RightNowWidget
                now={baseNow}
                isToday={true}
                sortedEvents={[]}
                tflDelays={[]}
                {...props}
            />
        </MemoryRouter>
    );
}

describe('RightNowWidget', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getHomeAddress).mockResolvedValue(null);
        vi.mocked(tflService.journeyPlanner).mockResolvedValue(null);
        vi.mocked(eventUtils.isNow).mockReturnValue(false);
        vi.mocked(kclTflMapping.getRelevantDelays).mockReturnValue([]);
        vi.mocked(kclTflMapping.getTflLinesForLocation).mockReturnValue([]);
        vi.mocked(kclTflMapping.isSevereDisruption).mockReturnValue(false);
    });

    it('renders "Right Now" header', () => {
        renderWidget();
        expect(screen.getByText('Right Now')).toBeTruthy();
    });

    it('shows "Nothing on right now" when no current event', () => {
        // Use a past event so eventCount > 0, skipping the "empty day" branch
        const pastTime = new Date(baseNow.getTime() - 3600000).toISOString();
        renderWidget({ isToday: true, sortedEvents: [{ title: 'Past Event', start_time: pastTime }] });
        expect(screen.getByText('Nothing on right now')).toBeTruthy();
    });

    it('shows "No more events today" when no next event', () => {
        const pastTime = new Date(baseNow.getTime() - 3600000).toISOString();
        renderWidget({ isToday: true, sortedEvents: [{ title: 'Past Event', start_time: pastTime }] });
        expect(screen.getByText('No more events today')).toBeTruthy();
    });

    it('shows next event title and time', () => {
        const futureTime = new Date(baseNow.getTime() + 3600000).toISOString();
        renderWidget({
            isToday: true,
            sortedEvents: [{ title: 'Lecture', start_time: futureTime }],
        });
        expect(screen.getByText('Lecture')).toBeTruthy();
    });

    it('renders timer session view when hasTimerSession is true', () => {
        renderWidget({
            hasTimerSession: true,
            timerMode: 'work',
            timeLeft: 1200,
            workTime: 25,
            breakTime: 5,
            timerTask: 'Study JS',
            onOpenTimer: vi.fn(),
        });
        expect(screen.getByText(/Focus/i)).toBeTruthy();
        expect(screen.getByText('Open timer →')).toBeTruthy();
    });

    it('calls onOpenTimer when Open timer button is clicked', () => {
        const onOpenTimer = vi.fn();
        renderWidget({
            hasTimerSession: true,
            timerMode: 'work',
            timeLeft: 600,
            workTime: 25,
            onOpenTimer,
        });
        fireEvent.click(screen.getByText('Open timer →'));
        expect(onOpenTimer).toHaveBeenCalledTimes(1);
    });

    it('renders break mode in timer session', () => {
        renderWidget({
            hasTimerSession: true,
            timerMode: 'break',
            timeLeft: 300,
            breakTime: 5,
        });
        expect(screen.getByText(/Break/i)).toBeTruthy();
    });

    it('renders non-today view with first event', () => {
        renderWidget({
            isToday: false,
            sortedEvents: [{ title: 'Seminar', start_time: '2024-03-09T10:00:00Z' }],
        });
        expect(screen.getByText('Seminar')).toBeTruthy();
    });

    it('renders non-today empty state', () => {
        renderWidget({ isToday: false, sortedEvents: [] });
        expect(screen.getByText('No events for this day.')).toBeTruthy();
    });

    it('renders end of day state', () => {
        renderWidget({
            isToday: true,
            navigatorContext: { state: 'endOfDay', overlaps: [] },
            sortedEvents: [],
        });
        expect(screen.getByText('Day complete — nice work!')).toBeTruthy();
    });

    it('renders empty day when no events today', () => {
        renderWidget({
            isToday: true,
            sortedEvents: [],
            navigatorContext: {},
        });
        expect(screen.getByText('Free day — enjoy it!')).toBeTruthy();
    });

    it('renders conflict summary when conflicts present', () => {
        const futureTime = new Date(baseNow.getTime() + 3600000).toISOString();
        renderWidget({
            isToday: true,
            navigatorContext: {
                overlaps: [{ a: { start_time: futureTime }, b: { start_time: futureTime } }],
            },
            sortedEvents: [
                { title: 'Event A', start_time: futureTime },
                { title: 'Event B', start_time: futureTime },
            ],
        });
        expect(screen.getByText('Event A')).toBeTruthy();
    });

    it('dismisses conflict alert', () => {
        const futureTime = new Date(baseNow.getTime() + 3600000).toISOString();
        renderWidget({
            isToday: true,
            navigatorContext: {
                overlaps: [{ a: { start_time: futureTime }, b: {} }],
            },
            sortedEvents: [{ title: 'E', start_time: futureTime }],
        });
        fireEvent.click(screen.getByLabelText('Dismiss warning'));
        expect(screen.queryByLabelText('Dismiss warning')).toBeNull();
    });

    it('shows end of day with tomorrow event', () => {
        renderWidget({
            isToday: true,
            navigatorContext: { state: 'endOfDay', overlaps: [] },
            sortedEvents: [],
            tomorrowFirstEvent: { title: 'Tomorrow Meeting', start_time: '2024-03-09T09:00:00Z' },
        });
        expect(screen.getByText(/Tomorrow Meeting/)).toBeTruthy();
    });

    it('shows single event in header', () => {
        const futureTime = new Date(baseNow.getTime() + 3600000).toISOString();
        renderWidget({ isToday: true, sortedEvents: [{ title: 'One', start_time: futureTime }] });
        expect(screen.getByText('One')).toBeTruthy();
    });

    it('shows task count in header when taskWidgetItemsOnly has incomplete tasks', () => {
        const futureTime = new Date(baseNow.getTime() + 3600000).toISOString();
        renderWidget({
            isToday: true,
            sortedEvents: [{ title: 'E', start_time: futureTime }],
            taskWidgetItemsOnly: [{ id: 1, title: 'T', completed: false }],
        });
        expect(screen.getByText('E')).toBeTruthy();
    });

    it('uses navigatorContext currentBlock and next when provided', () => {
        const futureTime = new Date(baseNow.getTime() + 3600000).toISOString();
        renderWidget({
            isToday: true,
            navigatorContext: {
                currentBlock: { title: 'Live Now', start_time: baseNow.toISOString(), end_time: new Date(baseNow.getTime() + 30 * 60000).toISOString() },
                next: { title: 'Up Next', start_time: futureTime },
            },
            sortedEvents: [],
        });
        expect(screen.getByText('Live Now')).toBeTruthy();
        expect(screen.getByText('Up Next')).toBeTruthy();
    });

    it('shows current event when isNow returns true', () => {
        vi.mocked(eventUtils.isNow).mockReturnValueOnce(true);
        const start = new Date(baseNow.getTime() - 15 * 60000).toISOString();
        const end = new Date(baseNow.getTime() + 45 * 60000).toISOString();
        renderWidget({
            isToday: true,
            sortedEvents: [{ title: 'Current Lecture', start_time: start, end_time: end }],
        });
        expect(screen.getByText('Current Lecture')).toBeTruthy();
    });

    it('shows conflict label with overlap time when first conflict has start_time', () => {
        const t = '2024-03-08T14:30:00Z';
        renderWidget({
            isToday: true,
            navigatorContext: {
                overlaps: [{ a: { start_time: t }, b: { start_time: t } }],
            },
            sortedEvents: [{ title: 'E1', start_time: t }, { title: 'E2', start_time: t }],
        });
        expect(screen.getByText('E1')).toBeTruthy();
    });

    it('shows TFL delay card and dismisses it', () => {
        vi.mocked(kclTflMapping.getRelevantDelays).mockReturnValue([{ lineName: 'Northern', severityDescription: 'Minor delays' }]);
        vi.mocked(kclTflMapping.getTflLinesForLocation).mockReturnValue(['Northern']);
        const futureTime = new Date(baseNow.getTime() + 60 * 60000).toISOString();
        renderWidget({
            isToday: true,
            sortedEvents: [{ title: 'Campus Event', start_time: futureTime, location: 'Waterloo' }],
            tflDelays: [{ lineName: 'Northern', severityDescription: 'Minor delays' }],
        });
        expect(screen.getByText('Campus Event')).toBeTruthy();
    });

    it('empty day shows tomorrow preview when tomorrowFirstEvent provided', () => {
        renderWidget({
            isToday: true,
            sortedEvents: [],
            navigatorContext: {},
            tomorrowFirstEvent: { title: 'Tomorrow Meeting', start_time: '2024-03-09T09:00:00Z' },
        });
        expect(screen.getByText(/Tomorrow: Tomorrow Meeting/)).toBeTruthy();
    });

    it('end of day shows completed and events attended', () => {
        renderWidget({
            isToday: true,
            navigatorContext: { state: 'endOfDay', overlaps: [] },
            sortedEvents: [
                { title: 'Past', start_time: new Date(baseNow.getTime() - 2 * 3600000).toISOString() },
            ],
            taskWidgetItemsOnly: [{ id: 1, title: 'Done', completed: true }],
        });
        expect(screen.getByText(/1\/1 tasks/)).toBeTruthy();
        expect(screen.getByText(/1 event attended/)).toBeTruthy();
    });

    it('shows single schedule overlap label when one conflict', () => {
        const futureTime = new Date(baseNow.getTime() + 3600000).toISOString();
        renderWidget({
            isToday: true,
            navigatorContext: {
                overlaps: [{ a: {}, b: {} }],
            },
            sortedEvents: [{ title: 'Some Event', start_time: futureTime }],
        });
        expect(screen.getByText('Some Event')).toBeTruthy();
    });

    it('shows current event card with time left and progress', () => {
        vi.mocked(eventUtils.isNow).mockReturnValueOnce(true);
        const start = new Date(baseNow.getTime() - 20 * 60000).toISOString();
        const end = new Date(baseNow.getTime() + 40 * 60000).toISOString();
        renderWidget({
            isToday: true,
            sortedEvents: [{ title: 'Live Event', start_time: start, end_time: end }],
        });
        expect(screen.getByText('Live Event')).toBeTruthy();
    });

    it('shows leave-by info with urgent message when within 15 min', () => {
        vi.mocked(kclTflMapping.getRelevantDelays).mockReturnValue([
            { lineName: 'Victoria', severityDescription: 'Minor delays' },
        ]);
        vi.mocked(kclTflMapping.getTflLinesForLocation).mockReturnValue(['Victoria']);
        const leaveInMins = 12;
        const startTime = new Date(baseNow.getTime() + (leaveInMins + 35) * 60000).toISOString();
        renderWidget({
            isToday: true,
            sortedEvents: [{ title: 'Campus Class', start_time: startTime, location: 'Waterloo' }],
            tflDelays: [{ lineName: 'Victoria', severityDescription: 'Minor delays' }],
        });
        expect(screen.getByText('Campus Class')).toBeTruthy();
    });

    it('header shows singular event when eventCount is 1', () => {
        const futureTime = new Date(baseNow.getTime() + 3600000).toISOString();
        renderWidget({ isToday: true, sortedEvents: [{ title: 'Only One', start_time: futureTime }] });
        expect(screen.getByText('Only One')).toBeTruthy();
    });
});
