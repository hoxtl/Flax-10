import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MiniTimeline } from '../../../../../pages/Homepage/components/MiniTimeline/MiniTimeline';

let mockRows = [];

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag) => {
        const Tag = typeof tag === 'string' ? tag : 'div';
        return ({ children, ...props }) => {
          const { initial, animate, exit, transition, variants, layout, whileTap, ...rest } = props;
          return <Tag {...rest}>{children}</Tag>;
        };
      },
    },
  ),
}));

vi.mock('../../../../../api/userService', () => ({
  getUserSettings: vi.fn().mockResolvedValue({ sleep_time: '23:00:00', wake_time: '07:00:00' }),
}));

vi.mock('../../../../../components/Calendar/utils/dateUtils', () => ({
  isToday: () => true,
}));

vi.mock('../../../../../pages/Homepage/utils/planTimelineRows', () => ({
  computePlanTimelineRows: () => mockRows,
}));

vi.mock('../../../../../pages/Homepage/utils/taskUtils', () => ({
  getTasksThatFitGap: (tasks, mins) => {
    const t = (tasks || []).find(Boolean) || null;
    return { suggested: t && mins > 0 ? t : null };
  },
  taskDurationMins: (task) => ((task?.estimated_blocks || 1) * 25),
}));

vi.mock('../../../../../pages/Homepage/utils/eventUtils', () => ({
  stripEmojiFromTitle: (t) => String(t || '').replace(/[^\p{L}\p{N}\p{P}\p{Z}]/gu, '').trim(),
  isNow: () => true,
}));

vi.mock('../../../../../pages/Homepage/components/MiniTimeline/HourMarkRow', () => ({
  HourMarkRow: ({ row }) => <div>HOUR:{row.id}</div>,
}));
vi.mock('../../../../../pages/Homepage/components/MiniTimeline/TinyGapRow', () => ({
  TinyGapRow: ({ row }) => <div>TINY:{row.id}</div>,
}));
vi.mock('../../../../../pages/Homepage/components/MiniTimeline/NowRow', () => ({
  NowRow: ({ nowRowRef }) => <div ref={nowRowRef}>NOW_ROW</div>,
}));

vi.mock('../../../../../pages/Homepage/components/MiniTimeline/PlanFreeRow', () => ({
  PlanFreeRow: ({ row, isBestGap, assignedTask, setSlotPopoverRowId, slotPopoverRowId, slotPopoverRef }) => (
    <div>
      <div>FREE:{row.id}{isBestGap ? ':BEST' : ''}{assignedTask ? `:${assignedTask.title}` : ''}</div>
      <button type="button" onClick={() => setSlotPopoverRowId(row.id)}>open-slot</button>
      {slotPopoverRowId === row.id && (
        <div ref={slotPopoverRef} data-testid="slot-popover">SLOT_POPOVER</div>
      )}
    </div>
  ),
}));

vi.mock('../../../../../pages/Homepage/components/MiniTimeline/PlanEventRow', () => ({
  PlanEventRow: ({ row, conflictPopoverRowId, conflictPopoverRef, setConflictPopoverRowId, onEventContextMenu }) => (
    <div>
      <div>EVENT:{row.id}</div>
      <button type="button" onClick={() => setConflictPopoverRowId(row.id)}>open-conflict</button>
      <button type="button" onClick={() => onEventContextMenu?.({ id: 'ev1', tag: 'tag1' }, 10, 20)}>open-ctx</button>
      {conflictPopoverRowId === row.id && (
        <div ref={conflictPopoverRef} data-testid="conflict-popover">CONFLICT_POPOVER</div>
      )}
    </div>
  ),
}));

vi.mock('../../../../../pages/Homepage/components/MiniTimeline/ConflictPairRow', () => ({
  ConflictPairRow: ({ row, onEventContextMenu }) => (
    <div>
      <div>GROUP:{row.id}</div>
      <button type="button" onClick={() => onEventContextMenu?.({ id: 'ev2', tag: 'tag2' }, 1, 2)}>open-ctx-group</button>
    </div>
  ),
}));

vi.mock('../../../../../pages/Homepage/components/MiniTimeline/EventContextMenu', () => ({
  EventContextMenu: ({ eventItem, onClose, onDelete }) => (
    <div data-testid="ctx">
      <div>CTX:{eventItem?.id}</div>
      <button type="button" onClick={() => onDelete?.(eventItem)}>delete</button>
      <button type="button" onClick={() => onClose?.()}>close</button>
    </div>
  ),
}));

const styles = {
  planTimelineWrap: 'planTimelineWrap',
  planTimelineList: 'planTimelineList',
  planTimelineListHasConflict: 'planTimelineListHasConflict',
  planTimelineEmpty: 'planTimelineEmpty',
  planTimelineEmptyText: 'planTimelineEmptyText',
  planTimelineNowStrip: 'planTimelineNowStrip',
  planTimelineNowStripDot: 'planTimelineNowStripDot',
  planTimelineNowStripLabel: 'planTimelineNowStripLabel',
  planTimelineNowStripTask: 'planTimelineNowStripTask',
  planTimelineNowStripTimer: 'planTimelineNowStripTimer',
};

function renderTL(props = {}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return render(
    <MiniTimeline
      sortedEvents={props.sortedEvents ?? []}
      selectedDate={props.selectedDate ?? today}
      now={props.now ?? new Date(today.getTime() + 12 * 60 * 60 * 1000)}
      dayTasks={props.dayTasks ?? []}
      tasksDueToday={props.tasksDueToday ?? []}
      suggestableTasks={props.suggestableTasks ?? []}
      deadlineSuggestions={props.deadlineSuggestions ?? []}
      taskLists={props.taskLists ?? []}
      onQuickStart={props.onQuickStart ?? vi.fn()}
      onTaskToggle={props.onTaskToggle ?? vi.fn()}
      onCardClick={props.onCardClick ?? vi.fn()}
      onEdit={props.onEdit ?? vi.fn()}
      onConflictAutoMove={props.onConflictAutoMove ?? vi.fn()}
      onDelete={props.onDelete ?? vi.fn()}
      onPushTomorrow={props.onPushTomorrow ?? vi.fn()}
      onReschedule={props.onReschedule ?? vi.fn()}
      getTag={props.getTag ?? null}
      completedEventIds={props.completedEventIds ?? new Set()}
      onToggleComplete={props.onToggleComplete ?? vi.fn()}
      hasTimerSession={props.hasTimerSession ?? false}
      timerTask={props.timerTask ?? null}
      timeLeft={props.timeLeft ?? 0}
      timerMode={props.timerMode ?? 'work'}
      styles={styles}
    />,
  );
}

describe('MiniTimeline', () => {
  beforeEach(() => {
    mockRows = [];
    vi.stubGlobal('requestAnimationFrame', (cb) => setTimeout(cb, 0));
    vi.stubGlobal('cancelAnimationFrame', (id) => clearTimeout(id));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows empty state when no rows', () => {
    mockRows = [];
    renderTL();
    expect(screen.getByText('No events scheduled for this day.')).toBeTruthy();
  });

  it('renders timer strip when a focus/break session is active', () => {
    mockRows = [{ id: 'h1', type: 'hourMark' }];
    renderTL({ hasTimerSession: true, timerMode: 'break', timerTask: 'Reading', timeLeft: 90 });
    expect(screen.getByText('Break')).toBeTruthy();
    expect(screen.getByText('Reading')).toBeTruthy();
    expect(screen.getByText('01:30')).toBeTruthy();
  });

  it('renders current block strip when no timer and a now event exists', () => {
    mockRows = [{ id: 'n1', type: 'now' }];
    renderTL({
      hasTimerSession: false,
      sortedEvents: [{ id: 'e1', title: '📚 Lecture', start_time: '2026-03-09T10:00:00Z', end_time: '2026-03-09T11:00:00Z' }],
    });
    expect(screen.getByText('Now')).toBeTruthy();
    expect(screen.getByText(/Lecture/)).toBeTruthy();
  });

  it('auto-scrolls the NOW row into view on mount', async () => {
    const prev = Element.prototype.scrollIntoView;
    if (!prev) Element.prototype.scrollIntoView = () => {};
    const spy = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});
    mockRows = [{ id: 'n1', type: 'now' }];
    renderTL();
    await waitFor(() => expect(spy).toHaveBeenCalled());
    spy.mockRestore();
    Element.prototype.scrollIntoView = prev;
  });

  it('closes conflict and slot popovers on outside click', () => {
    mockRows = [
      { id: 'ev', type: 'event', title: 'Event' },
      { id: 'free', type: 'free', minutes: 30 },
    ];
    renderTL({ suggestableTasks: [{ id: 1, title: 'Task', estimated_blocks: 1 }] });

    fireEvent.click(screen.getByText('open-conflict'));
    expect(screen.getByTestId('conflict-popover')).toBeTruthy();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByTestId('conflict-popover')).toBeNull();

    fireEvent.click(screen.getByText('open-slot'));
    expect(screen.getByTestId('slot-popover')).toBeTruthy();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByTestId('slot-popover')).toBeNull();
  });

  it('opens event context menu and calls onDelete', async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    mockRows = [{ id: 'ev', type: 'event', title: 'Event' }];
    renderTL({ onDelete });

    fireEvent.click(screen.getByText('open-ctx'));
    expect(screen.getByTestId('ctx')).toBeTruthy();
    fireEvent.click(screen.getByText('delete'));
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 'ev1' })));
    fireEvent.click(screen.getByText('close'));
    expect(screen.queryByTestId('ctx')).toBeNull();
  });
});

