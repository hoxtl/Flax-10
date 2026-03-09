import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('react-router-dom', () => ({
    Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

vi.mock('lucide-react', () => ({
    RotateCw: () => <svg data-testid="rotate-icon" />,
    Pencil: () => <svg data-testid="pencil-icon" />,
    AlertTriangle: () => <svg data-testid="alert-icon" />,
}));

vi.mock('../../../../pages/Homepage/utils/dateFormatUtils', () => ({
    formatTime12h: vi.fn(t => t ? '9:00 am' : ''),
    fmtDurationShort: vi.fn(() => '1h'),
}));

vi.mock('../../../../pages/Homepage/utils/eventUtils', () => ({
    stripEmojiFromTitle: vi.fn(t => t),
}));

vi.mock('../../../../pages/Homepage/utils/timelineUtils', () => ({
    getGapStartDate: vi.fn(() => new Date()),
}));

vi.mock('../../../../components/Settings/hooks/useSleepWarning', () => ({
    isDuringSleepWindow: vi.fn(() => false),
}));

import { PlanEventRow } from '../../../../pages/Homepage/components/MiniTimeline/PlanEventRow';

const mockStyles = {
    planTimelineRow: 'row',
    planTimelineRowPast: 'past',
    planTimelineGutter: 'gutter',
    planTimelineTime: 'time',
    planTimelineSpineCell: 'spine',
    planTimelineCardWrap: 'cardWrap',
    planTimelineCard: 'card',
    planTimelineCardNow: 'now',
    planTimelineCardPast: 'past',
    planTimelineCardOverlap: 'overlap',
    planTimelineCardRoutine: 'routine',
    planTimelineCardWithDuration: 'withDuration',
    planTimelineCardAccent: 'accent',
    planTimelineCardBody: 'body',
    planTimelineCardTimeStack: 'timeStack',
    planTimelineCardTimeRow: 'timeRow',
};

const baseRow = {
    id: 'row-1',
    item: {
        id: 1,
        title: 'Morning Meeting',
        start_time: '2024-03-04T09:00:00Z',
        end_time: '2024-03-04T10:00:00Z',
        tag: null,
    },
    isPast: false,
    active: false,
    matchTask: null,
    isOverlap: false,
    isRoutine: false,
    moduleCode: null,
    durationMins: 60,
    spacingBeforePx: 0,
    endMins: 600,
};

function renderRow(props = {}) {
    return render(
        <PlanEventRow
            row={baseRow}
            rows={[baseRow]}
            taskLists={[]}
            conflictPopoverRowId={null}
            conflictPopoverRef={{ current: null }}
            setConflictPopoverRowId={vi.fn()}
            onConflictAutoMove={vi.fn()}
            onPushTomorrow={vi.fn()}
            onEdit={vi.fn()}
            onCardClick={vi.fn()}
            onEventContextMenu={vi.fn()}
            onTaskToggle={vi.fn()}
            onToggleComplete={vi.fn()}
            onReschedule={vi.fn()}
            completedEventIds={[]}
            selectedDate={new Date('2024-03-04')}
            isToday={true}
            getTag={vi.fn(() => null)}
            styles={mockStyles}
            sleepWindow={null}
            {...props}
        />
    );
}

describe('PlanEventRow', () => {
    it('renders event title', () => {
        renderRow();
        expect(screen.getByText('Morning Meeting')).toBeTruthy();
    });

    it('renders start time', () => {
        renderRow();
        expect(screen.getAllByText('9:00 am').length).toBeGreaterThan(0);
    });

    it('calls onCardClick when card is clicked', () => {
        const onCardClick = vi.fn();
        renderRow({ onCardClick });
        const card = document.querySelector('[role="button"]');
        fireEvent.click(card);
        expect(onCardClick).toHaveBeenCalledWith(baseRow.item, null, expect.any(Object));
    });

    it('calls onEdit when card clicked with no onCardClick', () => {
        const onEdit = vi.fn();
        renderRow({ onCardClick: undefined, onEdit });
        const card = document.querySelector('[role="button"]');
        fireEvent.click(card);
        expect(onEdit).toHaveBeenCalledWith(baseRow.item, null);
    });

    it('calls onEventContextMenu on context menu', () => {
        const onEventContextMenu = vi.fn();
        renderRow({ onEventContextMenu });
        const card = document.querySelector('[role="button"]');
        fireEvent.contextMenu(card, { clientX: 50, clientY: 100 });
        expect(onEventContextMenu).toHaveBeenCalledWith(baseRow.item, 50, 100);
    });

    it('renders with isPast styling', () => {
        renderRow({ row: { ...baseRow, isPast: true, active: false } });
        const card = document.querySelector('[role="button"]');
        expect(card).toBeTruthy();
    });

    it('opens conflict popover on click when isOverlap', () => {
        const setConflictPopoverRowId = vi.fn();
        renderRow({
            row: { ...baseRow, isOverlap: true },
            setConflictPopoverRowId,
        });
        const card = document.querySelector('[role="button"]');
        fireEvent.click(card);
        expect(setConflictPopoverRowId).toHaveBeenCalled();
    });
});
