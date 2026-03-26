/**
 * Covers PlanEventRow interactions and display states.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createFnMap } from '../../../utils/factoryUtils';

vi.mock('react-router-dom', () => ({
    Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

vi.mock('lucide-react', () => ({
    RotateCw: () => <svg data-testid="rotate-icon" />,
    Pencil: () => <svg data-testid="pencil-icon" />,
    AlertTriangle: () => <svg data-testid="alert-icon" />,
}));

vi.mock('../../../../pages/Homepage/utils/dateFormatUtils', () => ({
    formatTime: vi.fn((t) => (t ? '9:00 am' : '')),
    formatTime12h: vi.fn((t) => (t ? '9:00 am' : '')),
    fmtDurationShort: vi.fn(() => '1h'),
}));

vi.mock('../../../../pages/Homepage/utils/eventUtils', () => ({
    stripEmojiFromTitle: vi.fn(t => t),
}));

vi.mock('../../../../pages/Homepage/utils/timelineUtils', () => ({
    getGapStartDate: vi.fn(() => new Date()),
}));

vi.mock('../../../../components/Settings/hooks/useSleepWarning', () => ({
    doesEventOverlapSleepWindow: vi.fn(() => false),
}));

import { PlanEventRow } from '../../../../pages/Homepage/components/MiniTimeline/PlanEventRow';
import * as useSleepWarning from '../../../../components/Settings/hooks/useSleepWarning';
import * as homepageEventUtils from '../../../../pages/Homepage/utils/eventUtils';

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

const rowActionNames = [
    'setConflictPopoverRowId',
    'onConflictAutoMove',
    'onPushTomorrow',
    'onEdit',
    'onCardClick',
    'onEventContextMenu',
    'onTaskToggle',
    'onToggleComplete',
    'onReschedule',
];

const baseRenderProps = {
    row: baseRow,
    rows: [baseRow],
    conflictPopoverRowId: null,
    conflictPopoverRef: { current: null },
    completedEventIds: [],
    selectedDate: new Date('2024-03-04'),
    isToday: true,
    getTag: vi.fn(() => null),
    styles: mockStyles,
    sleepWindow: null,
};

const buildRowProps = (overrides = {}) => ({
    ...baseRenderProps,
    ...createFnMap(rowActionNames),
    ...overrides,
});

function renderRow(props = {}) {
    return render(<PlanEventRow taskLists={[]} {...buildRowProps(props)} />);
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
        expect(onEdit).toHaveBeenCalledWith(baseRow.item, null, expect.anything());
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

    it('renders active styling when the row is active', () => {
        renderRow({ row: { ...baseRow, active: true } });
        const card = document.querySelector('[role="button"]');
        expect(card.className).toContain(mockStyles.planTimelineCardNow);
    });

    it('renders routine styling when the row is marked as routine', () => {
        renderRow({ row: { ...baseRow, isRoutine: true } });
        const card = document.querySelector('[role="button"]');
        expect(card.className).toContain(mockStyles.planTimelineCardRoutine);
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

    it('renders Conflict badge and Fix it button when isOverlap', () => {
        renderRow({ row: { ...baseRow, isOverlap: true } });
        expect(screen.getByText('Conflict')).toBeTruthy();
        expect(screen.getByText('Fix it')).toBeTruthy();
    });

    it('calls handleAutoReschedule when Auto-move clicked and nextFreeRow exists', () => {
        const onConflictAutoMove = vi.fn();
        const setConflictPopoverRowId = vi.fn();
        const freeRow = { type: 'free', gapStartMins: 700, minutes: 60 };
        renderRow({
            row: { ...baseRow, isOverlap: true },
            rows: [baseRow, freeRow],
            conflictPopoverRowId: baseRow.id,
            setConflictPopoverRowId,
            onConflictAutoMove,
        });
        fireEvent.click(screen.getByText('Auto-move to next gap'));
        expect(onConflictAutoMove).toHaveBeenCalled();
    });

    it('shows No free window when no nextFreeRow', () => {
        renderRow({
            row: { ...baseRow, isOverlap: true },
            rows: [baseRow],
            conflictPopoverRowId: baseRow.id,
        });
        expect(screen.getByText('No free window')).toBeTruthy();
    });

    it('calls onPushTomorrow when Move to tomorrow clicked', () => {
        const onPushTomorrow = vi.fn();
        renderRow({
            row: { ...baseRow, isOverlap: true },
            rows: [baseRow],
            conflictPopoverRowId: baseRow.id,
            onPushTomorrow,
        });
        fireEvent.click(screen.getByText('→ Move to tomorrow'));
        expect(onPushTomorrow).toHaveBeenCalledWith(baseRow.item);
    });

    it('calls onEdit when Manually adjust clicked', () => {
        const onEdit = vi.fn();
        renderRow({
            row: { ...baseRow, isOverlap: true },
            conflictPopoverRowId: baseRow.id,
            onEdit,
        });
        fireEvent.click(screen.getByText('Manually adjust'));
        expect(onEdit).toHaveBeenCalledWith(baseRow.item, null);
    });

    it('responds to keyboard Enter', () => {
        const onCardClick = vi.fn();
        renderRow({ onCardClick });
        const card = document.querySelector('[role="button"]');
        fireEvent.keyDown(card, { key: 'Enter' });
        expect(onCardClick).toHaveBeenCalled();
    });

    it('responds to keyboard Space', () => {
        const onCardClick = vi.fn();
        renderRow({ onCardClick });
        const card = document.querySelector('[role="button"]');
        fireEvent.keyDown(card, { key: ' ' });
        expect(onCardClick).toHaveBeenCalled();
    });

    it('renders module code pill when moduleCode provided', () => {
        renderRow({ row: { ...baseRow, moduleCode: 'CS101' } });
        expect(screen.getByText('CS101')).toBeTruthy();
    });

    it('renders duration pill when durationMins > 0', () => {
        renderRow();
        expect(screen.getByText('1h')).toBeTruthy();
    });

    it('does not render duration pill when durationMins is 0', () => {
        renderRow({ row: { ...baseRow, durationMins: 0 } });
        expect(screen.queryByText('1h')).toBeNull();
    });

    it('shows sleep badge when isDuringSleepWindow returns true', () => {
        vi.mocked(useSleepWarning.doesEventOverlapSleepWindow).mockReturnValueOnce(true);
        renderRow();
        expect(screen.getByLabelText('Scheduled during sleep hours')).toBeInTheDocument();
    });

    it('toggles conflict popover when Fix it button is clicked', () => {
        const setConflictPopoverRowId = vi.fn();
        renderRow({
            row: { ...baseRow, isOverlap: true },
            setConflictPopoverRowId,
        });
        fireEvent.click(screen.getByText('Fix it'));
        expect(setConflictPopoverRowId).toHaveBeenCalledWith(expect.any(Function));
    });


    it('renders task list link when matchTask has task_list and no moduleCode', () => {
        renderRow({
            row: { ...baseRow, moduleCode: null, matchTask: { task_list: 5 } },
            taskLists: [{ id: 5, name: 'My List' }],
        });
        const link = screen.getByRole('link', { name: 'My List' });
        expect(link).toHaveAttribute('href', '/tasks?list=5');
    });

    it('renders the module pill instead of a task list link when both moduleCode and matchTask are present', () => {
        renderRow({ row: { ...baseRow, moduleCode: 'CS101', matchTask: { task_list: 5 } } });
        expect(screen.getByText('CS101')).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'CS101' })).toBeNull();
    });

    it('does not call onPushTomorrow when disabled', () => {
        renderRow({
            row: { ...baseRow, isOverlap: true },
            rows: [baseRow],
            conflictPopoverRowId: baseRow.id,
            onPushTomorrow: undefined,
        });
        const btn = screen.getByRole('button', { name: /Move to tomorrow/ });
        expect(btn).toBeDisabled();
    });

    it('Auto-move button disabled when no nextFreeRow', () => {
        renderRow({
            row: { ...baseRow, isOverlap: true },
            rows: [baseRow],
            conflictPopoverRowId: baseRow.id,
        });
        const btn = screen.getByRole('button', { name: /No free window/ });
        expect(btn).toBeDisabled();
        fireEvent.click(btn);
    });

    it('toggles popover closed when clicking card again', () => {
        const setConflictPopoverRowId = vi.fn();
        renderRow({
            row: { ...baseRow, isOverlap: true },
            conflictPopoverRowId: baseRow.id,
            setConflictPopoverRowId,
        });
        const card = document.querySelector('[role="button"]');
        fireEvent.click(card);
        const updater = setConflictPopoverRowId.mock.calls[0][0];
        expect(updater(baseRow.id)).toBeNull();
        expect(updater('other-row')).toBe(baseRow.id);
    });

    it('renders end time when different from start', async () => {
        const { formatTime12h } = await import('../../../../pages/Homepage/utils/dateFormatUtils');
        formatTime12h.mockReturnValueOnce('9:00 am').mockReturnValueOnce('10:00 am');
        renderRow();
        expect(screen.getByText(/10:00 am/)).toBeTruthy();
    });

    it('applies the active row class when the event is happening now', () => {
        renderRow({ row: { ...baseRow, active: true } });
        const card = document.querySelector('[role="button"]');
        expect(card?.className).toContain('now');
    });

    it('falls back to the original title and suppresses edit/context actions for read-only events', () => {
        vi.mocked(homepageEventUtils.stripEmojiFromTitle).mockReturnValueOnce('');
        const onEdit = vi.fn();
        const onEventContextMenu = vi.fn();
        renderRow({
            row: { ...baseRow, isOverlap: true, item: { ...baseRow.item, title: 'Society fallback title', start_time: '', end_time: '', source: 'society' } },
            conflictPopoverRowId: baseRow.id,
            onCardClick: undefined, onEdit, onEventContextMenu,
        });

        const card = document.querySelector('[role="button"]');
        fireEvent.click(card);
        fireEvent.contextMenu(card, { clientX: 12, clientY: 24 });

        expect(screen.getByText('Society fallback title')).toBeInTheDocument();
        expect(onEdit).not.toHaveBeenCalled();
        expect(onEventContextMenu).not.toHaveBeenCalled();
    });
});
