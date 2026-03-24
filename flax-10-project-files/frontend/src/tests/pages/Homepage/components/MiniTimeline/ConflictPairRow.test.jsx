import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConflictPairRow } from '../../../../../pages/Homepage/components/MiniTimeline/ConflictPairRow';
import * as useSleepWarning from '../../../../../components/Settings/hooks/useSleepWarning';

vi.mock('../../../../../components/Settings/hooks/useSleepWarning', () => ({
  doesEventOverlapSleepWindow: vi.fn(() => false),
}));

const mockStyles = {
  planTimelineRow: 'row',
  planTimelineGutter: 'gutter',
  planTimelineTime: 'time',
  planTimelineSpineCell: 'spine',
  planTimelineConflictPairWrap: 'wrap',
  planTimelineConflictPairCards: 'cards',
  planTimelineConflictPairCard: 'card',
  planTimelineConflictPairCardAccent: 'accent',
  planTimelineConflictPairCardTime: 'cardTime',
  planTimelineConflictPairCardTitleRow: 'titleRow',
  planTimelineConflictPairCardTitle: 'cardTitle',
  planTimelineConflictSleepBadge: 'sleepBadge',
  planTimelineConflictPairActions: 'actions',
  planTimelineConflictPairIcon: 'icon',
  planTimelineConflictPairLabelText: 'label',
  planTimelineConflictPillGroup: 'pillGroup',
  planTimelineConflictAutoBtn: 'autoBtn',
  planTimelineConflictItemBtn: 'itemBtn',
  planTimelineConflictItemText: 'itemText',
};

const selectedDate = new Date('2024-03-08');

const row = {
  type: 'conflict',
  items: [
    {
      id: 'a1',
      item: {
        id: 1,
        title: 'Lecture',
        start_time: '2024-03-08T10:00:00',
        end_time: '2024-03-08T11:00:00',
        tag_name: 'lecture',
        tag: null,
      },
      durationMins: 60,
    },
    {
      id: 'a2',
      item: {
        id: 2,
        title: 'Study session',
        start_time: '2024-03-08T10:30:00',
        end_time: '2024-03-08T11:30:00',
        tag_name: 'study',
        tag: null,
      },
      durationMins: 60,
    },
  ],
  startMins: 600,
  endMins: 690,
};

const rowsWithFreeGap = [
  row,
  { type: 'free', gapStartMins: 690, minutes: 60 },
];

const rowsNoFree = [row];

function renderConflictPairRow(props = {}) {
  return render(
    <ConflictPairRow
      row={row}
      rows={rowsNoFree}
      styles={mockStyles}
      selectedDate={selectedDate}
      sleepWindow={{ sleepTime: '23:00', wakeTime: '07:00' }}
      getTag={vi.fn()}
      {...props}
    />
  );
}

describe('ConflictPairRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders both conflict event titles', () => {
    renderConflictPairRow();
    expect(screen.getAllByText('Lecture').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Study session').length).toBeGreaterThan(0);
  });

  it('renders overlap label', () => {
    renderConflictPairRow();
    expect(screen.getByText('2 events overlap')).toBeTruthy();
  });

  it('renders No free window when no free row available', () => {
    renderConflictPairRow({ rows: rowsNoFree });
    expect(screen.getByText('No free window')).toBeTruthy();
  });

  it('renders Auto-arrange when free row available', () => {
    renderConflictPairRow({ rows: rowsWithFreeGap });
    expect(screen.getByText('Auto-arrange')).toBeTruthy();
  });

  it('renders Move to tomorrow when no free window', () => {
    const onPushTomorrow = vi.fn();
    renderConflictPairRow({ rows: rowsNoFree, onPushTomorrow });
    const buttons = screen.getAllByText('→ Move to tomorrow');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('calls onEdit when card clicked and no onCardClick', () => {
    const onEdit = vi.fn();
    renderConflictPairRow({ onEdit });
    const card = screen.getAllByText('Study session')[0].closest('[role="button"]');
    fireEvent.click(card);
    expect(onEdit).toHaveBeenCalled();
  });

  it('calls onEdit when Edit button clicked', () => {
    const onEdit = vi.fn();
    renderConflictPairRow({ onEdit });
    fireEvent.click(screen.getByTitle('Edit Study session'));
    expect(onEdit).toHaveBeenCalled();
  });

  it('calls onConflictAutoMove when Auto-arrange clicked', () => {
    const onConflictAutoMove = vi.fn();
    renderConflictPairRow({ rows: rowsWithFreeGap, onConflictAutoMove });
    fireEvent.click(screen.getByText('Auto-arrange'));
    expect(onConflictAutoMove).toHaveBeenCalled();
  });

  it('calls onPushTomorrow when Move to tomorrow clicked', () => {
    const onPushTomorrow = vi.fn();
    renderConflictPairRow({ rows: rowsNoFree, onPushTomorrow });
    const moveButtons = screen.getAllByRole('button', { name: '→ Move to tomorrow' });
    fireEvent.click(moveButtons[0]);
    expect(onPushTomorrow).toHaveBeenCalled();
  });

  it('calls onEventContextMenu on context menu', () => {
    const onEventContextMenu = vi.fn();
    renderConflictPairRow({ onEventContextMenu });
    const card = screen.getAllByText('Study session')[0].closest('[role="button"]');
    fireEvent.contextMenu(card);
    expect(onEventContextMenu).toHaveBeenCalled();
  });

  it('responds to keyboard Enter on card', () => {
    const onEdit = vi.fn();
    renderConflictPairRow({ onEdit });
    const card = screen.getAllByText('Study session')[0].closest('[role="button"]');
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onEdit).toHaveBeenCalled();
  });

  it('responds to keyboard Space on card', () => {
    const onCardClick = vi.fn();
    renderConflictPairRow({ onCardClick });
    const card = screen.getAllByText('Study session')[0].closest('[role="button"]');
    fireEvent.keyDown(card, { key: ' ' });
    expect(onCardClick).toHaveBeenCalled();
  });

  it('calls onCardClick when card is clicked and onCardClick is provided', () => {
    const onCardClick = vi.fn();
    renderConflictPairRow({ onCardClick });
    const card = screen.getAllByText('Study session')[0].closest('[role="button"]');
    fireEvent.click(card);
    expect(onCardClick).toHaveBeenCalled();
  });

  it('allows read-only lecture cards to open with onCardClick', () => {
    const onCardClick = vi.fn();
    renderConflictPairRow({ onCardClick });
    const card = screen.getAllByText('Lecture')[0].closest('[role="button"]');
    fireEvent.click(card);
    expect(onCardClick).toHaveBeenCalled();
  });

  it('shows sleep badge when isDuringSleepWindow returns true', () => {
    vi.mocked(useSleepWarning.doesEventOverlapSleepWindow).mockReturnValueOnce(true);
    renderConflictPairRow();
    expect(screen.getByLabelText('Scheduled during sleep hours')).toBeInTheDocument();
  });

  it('renders time label in gutter', () => {
    renderConflictPairRow();
    const gutter = document.querySelector(`.${mockStyles.planTimelineGutter}`);
    expect(gutter).toBeTruthy();
    expect(gutter?.textContent).toMatch(/\d|am|pm/i);
  });

  it('does not call handleAutoMove when onConflictAutoMove is missing', () => {
    renderConflictPairRow({ rows: rowsWithFreeGap, onConflictAutoMove: undefined });
    const btn = screen.getByText('Auto-arrange');
    expect(btn).not.toBeDisabled();
    fireEvent.click(btn);
  });

  it('does not show Move to tomorrow when freeRow exists', () => {
    renderConflictPairRow({ rows: rowsWithFreeGap, onPushTomorrow: vi.fn() });
    expect(screen.queryByText('→ Move to tomorrow')).toBeNull();
  });

  it('uses getTag for accent when provided', () => {
    const getTag = vi.fn((tag) => (tag ? { name: 'wellness' } : null));
    const customRow = {
      ...row,
      items: [{ ...row.items[0], item: { ...row.items[0].item, tag: 1 } }],
    };
    render(
      <ConflictPairRow
        row={customRow}
        rows={rowsNoFree}
        styles={mockStyles}
        selectedDate={selectedDate}
        sleepWindow={{ sleepTime: '23:00', wakeTime: '07:00' }}
        getTag={getTag}
      />
    );
    expect(getTag).toHaveBeenCalled();
  });

  it('renders end time when different from start', () => {
    renderConflictPairRow();
    expect(screen.getByText(/11:00/)).toBeTruthy();
  });

  it('falls back to onEdit when card clicked and no onCardClick, via keyboard Space', () => {
    const onEdit = vi.fn();
    renderConflictPairRow({ onCardClick: undefined, onEdit });
    const card = screen.getAllByText('Study session')[0].closest('[role="button"]');
    fireEvent.keyDown(card, { key: ' ' });
    expect(onEdit).toHaveBeenCalled();
  });
});
