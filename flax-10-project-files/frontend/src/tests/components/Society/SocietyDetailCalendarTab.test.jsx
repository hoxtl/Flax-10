import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

let monthViewClickEvent = { id: 'e1', title: 'Event', start_time: '2026-03-09T10:00:00Z' };

let mockIsModalOpen = false;
let mockModalEvent = null;
let mockModalInitialDate = null;
const mockOpenModal = vi.fn();
const mockCloseModal = vi.fn();
const mockConfirm = vi.fn();

vi.mock('../../../context/CalendarContext', () => ({
  CalendarProvider: ({ children }) => <>{children}</>,
  useEventModal: () => ({
    openModal: mockOpenModal,
    isModalOpen: mockIsModalOpen,
    closeModal: mockCloseModal,
    modalEvent: mockModalEvent,
    modalInitialDate: mockModalInitialDate,
  }),
}));

vi.mock('../../../context/ConfirmContext', () => ({
  useConfirm: () => mockConfirm,
}));

vi.mock('../../../components/Calendar/MonthView/MonthView', () => ({
  MonthView: ({ onEventClick, onMoreClick, readOnly, events }) => (
    <div>
      <div>readOnly:{String(!!readOnly)}</div>
      <div data-testid="event-count">count:{events?.length ?? 0}</div>
      <button type="button" onClick={() => onEventClick?.(monthViewClickEvent, { left: 0, top: 0 })}>
        click-event
      </button>
      <button type="button" onClick={() => onMoreClick?.(new Date('2026-03-09T00:00:00Z'))}>
        more
      </button>
    </div>
  ),
}));

vi.mock('../../../components/Calendar/header/CalendarHeaderUtils', () => ({
  CalendarNav: ({ showToday, onPrev, onNext, onToday, onDatePick }) => (
    <div data-testid="calendar-nav">
      <button type="button" onClick={onPrev}>prev</button>
      <button type="button" onClick={onNext}>next</button>
      {showToday && <button type="button" onClick={onToday}>Today</button>}
      <button type="button" onClick={() => onDatePick?.(new Date('2026-02-01T00:00:00Z'))}>pick-date</button>
    </div>
  ),
}));

vi.mock('../../../components/Calendar/utils/dateUtils', () => ({
  addMonths: vi.fn((d, n) => d),
  formatMonthYear: () => 'March 2026',
  isSameMonth: vi.fn(() => false),
}));

vi.mock('../../../components/Calendar/utils/recurrenceUtils', () => ({
  expandRecurringEvents: (events) => events,
}));

vi.mock('../../../components/Calendar/utils/eventUtils', () => ({
  hasRecurrence: (e) => !!e?.recurrence_rule,
  extractBaseEventId: (id) => String(id).split('-')[0],
}));

vi.mock('../../../components/Society/SocietyDetail/tags/TagFilterBar', () => ({
  default: ({ onFilterChange }) => (
    <div>TagFilterBar
      <button type="button" onClick={() => onFilterChange([1])}>filter-tag-1</button>
      <button type="button" onClick={() => onFilterChange([])}>clear-filter</button>
    </div>
  ),
}));
vi.mock('../../../components/Society/SocietyDetail/tags/TagManager', () => ({
  default: () => <div>TagManager</div>,
}));
vi.mock('../../../components/Society/SocietyDetail/tabs/calendarTab/SyncButton', () => ({
  default: () => <div>SyncButton</div>,
}));

vi.mock('../../../components/Calendar/EventModal/EventModal', () => ({
  EventModal: ({ onDelete, onSubmit }) => (
    <div data-testid="event-modal">
      <button type="button" onClick={() => onSubmit?.({ title: 'Updated' })}>submit</button>
      {onDelete != null && <button type="button" onClick={() => onDelete?.()}>delete</button>}
    </div>
  ),
}));

vi.mock('../../../components/Calendar/EventDetailPopup', () => ({
  EventDetailPopup: ({ actions, onClose }) => (
    <div data-testid="detail-popup">
      <button type="button" onClick={onClose}>close-popup</button>
      {actions?.map((a) => (
        <button key={a.label} type="button" onClick={a.onClick}>
          {a.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('../../../components/Calendar/EventsSummaryModal/EventsSummaryModal', () => ({
  EventsSummaryModal: ({ isOpen, onClose }) => (isOpen ? <div data-testid="summary-modal">Summary<button type="button" onClick={onClose}>close-summary</button></div> : null),
}));

import CalendarTab from '../../../components/Society/SocietyDetail/tabs/calendarTab/CalendarTab';
import * as dateUtils from '../../../components/Calendar/utils/dateUtils';

describe('Society detail CalendarTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dateUtils.isSameMonth).mockReturnValue(false);
    monthViewClickEvent = { id: 'e1', title: 'Event', start_time: '2026-03-09T10:00:00Z' };
    mockIsModalOpen = false;
    mockModalEvent = null;
    mockModalInitialDate = null;
    mockConfirm.mockResolvedValue(true);
  });

  it('in edit mode: clicking an announcement event calls onEditAnnouncement', () => {
    monthViewClickEvent = { id: 'e1', announcement: 5, start_time: '2026-03-09T10:00:00Z' };
    const onEditAnnouncement = vi.fn();
    const announcements = [{ id: 5, title: 'A' }];
    render(
      <CalendarTab
        events={[]}
        editMode={true}
        eventHandlers={{}}
        tags={[]}
        tagHandlers={{}}
        announcements={announcements}
        onEditAnnouncement={onEditAnnouncement}
      />,
    );

    fireEvent.click(screen.getByText('click-event'));
    expect(onEditAnnouncement).toHaveBeenCalledWith(announcements[0]);
    expect(mockOpenModal).not.toHaveBeenCalled();
  });

  it('in edit mode: clicking a normal event opens the event modal', () => {
    render(
      <CalendarTab
        events={[{ id: 'e1', title: 'Event', start_time: '2026-03-09T10:00:00Z' }]}
        editMode={true}
        eventHandlers={{}}
        tags={[]}
        tagHandlers={{}}
      />,
    );
    fireEvent.click(screen.getByText('click-event'));
    expect(mockOpenModal).toHaveBeenCalledWith(expect.objectContaining({ id: 'e1' }), 'society', '2026-03-09T10:00:00Z');
  });

  it('in read-only mode: clicking an event opens EventDetailPopup with view announcement action', async () => {
    monthViewClickEvent = { id: 'e1', announcementId: 9, start_time: '2026-03-09T10:00:00Z' };
    const onViewAnnouncement = vi.fn();
    render(
      <CalendarTab
        events={[{ id: 'e1', title: 'Event', start_time: '2026-03-09T10:00:00Z' }]}
        editMode={false}
        eventHandlers={{}}
        tags={[]}
        tagHandlers={{}}
        onViewAnnouncement={onViewAnnouncement}
      />,
    );

    fireEvent.click(screen.getByText('click-event'));
    expect(screen.getByTestId('detail-popup')).toBeTruthy();
    fireEvent.click(screen.getByText('View Announcement'));
    expect(onViewAnnouncement).toHaveBeenCalled();
  });

  it('recurring delete with ALTERNATE adds exception', async () => {
    mockIsModalOpen = true;
    mockModalEvent = { id: '123-abc', title: 'Recurring', start_time: '2026-03-09T10:00:00Z', recurrence_rule: 'FREQ=WEEKLY' };
    mockConfirm.mockResolvedValueOnce('ALTERNATE');
    const handlers = { onAddException: vi.fn(), onDelete: vi.fn(), onUpdate: vi.fn(), onAdd: vi.fn() };
    render(
      <CalendarTab
        events={[mockModalEvent]}
        editMode={true}
        eventHandlers={handlers}
        tags={[]}
        tagHandlers={{}}
      />,
    );

    fireEvent.click(screen.getByText('delete'));
    await waitFor(() => expect(handlers.onAddException).toHaveBeenCalledWith('123', '2026-03-09'));
    expect(mockCloseModal).toHaveBeenCalled();
  });

  it('does not render SyncButton when isMember is false', () => {
    render(
      <CalendarTab
        events={[]}
        editMode={false}
        societyId={1}
        isMember={false}
        societyName="Chess"
      />,
    );
    expect(screen.queryByText('SyncButton')).toBeNull();
  });

  it('hides Today button when viewing current month', () => {
    vi.mocked(dateUtils.isSameMonth).mockReturnValue(true);
    render(
      <CalendarTab events={[]} editMode={false} societyId={1} isMember={true} societyName="Chess" />,
    );
    expect(screen.queryByText('Today')).toBeNull();
  });

  it('CalendarNav prev/next/today/pick call setDate', () => {
    render(
      <CalendarTab events={[]} editMode={false} societyId={1} isMember={true} societyName="Chess" />,
    );
    fireEvent.click(screen.getByText('prev'));
    expect(dateUtils.addMonths).toHaveBeenCalled();
    fireEvent.click(screen.getByText('next'));
    fireEvent.click(screen.getByText('Today'));
    fireEvent.click(screen.getByText('pick-date'));
    expect(screen.getByTestId('calendar-nav')).toBeInTheDocument();
  });

  it('filterEvents filters by tag when tag filter is set', () => {
    render(
      <CalendarTab
        events={[
          { id: '1', title: 'E1', start_time: '2026-03-09T10:00:00Z', tag: 1 },
          { id: '2', title: 'E2', start_time: '2026-03-10T10:00:00Z', tag: 2 },
        ]}
        editMode={false}
        tags={[{ id: 1, color: '#f00' }, { id: 2, color: '#0f0' }]}
        societyId={1}
        isMember={true}
        societyName="Chess"
      />,
    );
    expect(screen.getByTestId('event-count').textContent).toBe('count:2');
    fireEvent.click(screen.getByText('filter-tag-1'));
    expect(screen.getByTestId('event-count').textContent).toBe('count:1');
    fireEvent.click(screen.getByText('clear-filter'));
    expect(screen.getByTestId('event-count').textContent).toBe('count:2');
  });

  it('read-only: event with announcementId calls onViewAnnouncement with no args when View Announcement clicked', () => {
    monthViewClickEvent = { id: 'e1', announcementId: 9, start_time: '2026-03-09T10:00:00Z' };
    const onViewAnnouncement = vi.fn();
    render(
      <CalendarTab
        events={[]}
        editMode={false}
        onViewAnnouncement={onViewAnnouncement}
        societyId={1}
        isMember={true}
        societyName="Chess"
      />,
    );
    fireEvent.click(screen.getByText('click-event'));
    fireEvent.click(screen.getByText('View Announcement'));
    expect(onViewAnnouncement).toHaveBeenCalled();
  });

  it('popup close calls closePopup', () => {
    render(
      <CalendarTab
        events={[{ id: 'e1', title: 'E', start_time: '2026-03-09T10:00:00Z' }]}
        editMode={false}
        societyId={1}
        isMember={true}
        societyName="Chess"
      />,
    );
    fireEvent.click(screen.getByText('click-event'));
    expect(screen.getByTestId('detail-popup')).toBeInTheDocument();
    fireEvent.click(screen.getByText('close-popup'));
    expect(screen.queryByTestId('detail-popup')).toBeNull();
  });

  it('edit mode popup Edit opens modal', () => {
    render(
      <CalendarTab
        events={[]}
        editMode={true}
        eventHandlers={{}}
        tags={[]}
        societyId={1}
        isMember={true}
        societyName="Chess"
      />,
    );
    fireEvent.click(screen.getByText('click-event'));
    expect(mockOpenModal).toHaveBeenCalledWith(monthViewClickEvent, 'society', monthViewClickEvent.start_time);
  });

  it('edit mode modal Delete confirms and calls onDelete', async () => {
    mockIsModalOpen = true;
    mockModalEvent = { id: 5, title: 'E', start_time: '2026-03-09T10:00:00Z' };
    mockConfirm.mockResolvedValueOnce(true);
    const handlers = { onDelete: vi.fn(), onUpdate: vi.fn(), onAdd: vi.fn() };
    render(
      <CalendarTab
        events={[]}
        editMode={true}
        eventHandlers={handlers}
        tags={[]}
        societyId={1}
        isMember={true}
        societyName="Chess"
      />,
    );
    fireEvent.click(screen.getByText('delete'));
    await waitFor(() => expect(handlers.onDelete).toHaveBeenCalled());
    expect(screen.queryByTestId('detail-popup')).toBeNull();
  });

  it('handlePopupDelete catch logs error', async () => {
    mockIsModalOpen = true;
    mockModalEvent = { id: 1, title: 'E', start_time: '2026-03-09T10:00:00Z' };
    mockConfirm.mockRejectedValueOnce(new Error('cancel'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const handlers = { onDelete: vi.fn() };
    render(
      <CalendarTab
        events={[]}
        editMode={true}
        eventHandlers={handlers}
        tags={[]}
        societyId={1}
        isMember={true}
        societyName="Chess"
      />,
    );
    fireEvent.click(screen.getByText('delete'));
    await waitFor(() => expect(consoleSpy).toHaveBeenCalled());
    consoleSpy.mockRestore();
  });

  it('recurring delete with choice true calls onDelete', async () => {
    mockIsModalOpen = true;
    mockModalEvent = { id: 'r1', title: 'R', start_time: '2026-03-09T10:00:00Z', recurrence_rule: 'FREQ=WEEKLY' };
    mockConfirm.mockResolvedValueOnce(true);
    const handlers = { onDelete: vi.fn(), onAddException: vi.fn() };
    render(
      <CalendarTab
        events={[]}
        editMode={true}
        eventHandlers={handlers}
        tags={[]}
        societyId={1}
        isMember={true}
        societyName="Chess"
      />,
    );
    fireEvent.click(screen.getByText('delete'));
    await waitFor(() => expect(handlers.onDelete).toHaveBeenCalled());
  });

  it('EventsSummaryModal onClose clears summary date', () => {
    render(
      <CalendarTab events={[]} editMode={false} societyId={1} isMember={true} societyName="Chess" />,
    );
    fireEvent.click(screen.getByText('more'));
    expect(screen.getByTestId('summary-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByText('close-summary'));
    expect(screen.queryByTestId('summary-modal')).toBeNull();
  });

  it('SocietyEventModal submit calls onUpdate when event has id', async () => {
    mockIsModalOpen = true;
    mockModalEvent = { id: 10, _baseId: 10, title: 'E', start_time: '2026-03-09T10:00:00Z' };
    const handlers = { onUpdate: vi.fn(), onAdd: vi.fn(), onDelete: vi.fn() };
    render(
      <CalendarTab
        events={[]}
        editMode={true}
        eventHandlers={handlers}
        tags={[]}
        societyId={1}
        isMember={true}
        societyName="Chess"
      />,
    );
    fireEvent.click(screen.getByText('submit'));
    await waitFor(() => expect(handlers.onUpdate).toHaveBeenCalledWith(10, expect.any(Object)));
    expect(mockCloseModal).toHaveBeenCalled();
  });

  it('SocietyEventModal submit calls onAdd when event has no id', async () => {
    mockIsModalOpen = true;
    mockModalEvent = { title: 'New', start_time: '2026-03-09T10:00:00Z' };
    const handlers = { onUpdate: vi.fn(), onAdd: vi.fn(), onDelete: vi.fn() };
    render(
      <CalendarTab
        events={[]}
        editMode={true}
        eventHandlers={handlers}
        tags={[]}
        societyId={1}
        isMember={true}
        societyName="Chess"
      />,
    );
    fireEvent.click(screen.getByText('submit'));
    await waitFor(() => expect(handlers.onAdd).toHaveBeenCalledWith(expect.any(Object)));
    expect(mockCloseModal).toHaveBeenCalled();
  });

  it('SocietyEventModal does not show delete when modalEvent has no id', () => {
    mockIsModalOpen = true;
    mockModalEvent = { title: 'New', start_time: '2026-03-09T10:00:00Z' };
    render(
      <CalendarTab
        events={[]}
        editMode={true}
        eventHandlers={{}}
        tags={[]}
        societyId={1}
        isMember={true}
        societyName="Chess"
      />,
    );
    expect(screen.getByTestId('event-modal')).toBeInTheDocument();
    expect(screen.queryByText('delete')).toBeNull();
  });

  it('getPopupActions returns null when no edit mode and no announcement', () => {
    monthViewClickEvent = { id: 'e1', title: 'Plain', start_time: '2026-03-09T10:00:00Z' };
    render(
      <CalendarTab
        events={[]}
        editMode={false}
        societyId={1}
        isMember={true}
        societyName="Chess"
      />,
    );
    fireEvent.click(screen.getByText('click-event'));
    expect(screen.getByTestId('detail-popup')).toBeInTheDocument();
    expect(screen.queryByText('Edit')).toBeNull();
    expect(screen.queryByText('View Announcement')).toBeNull();
  });

  it('popup with editMode after rerender shows Edit/Delete and their handlers run', async () => {
    const handlers = { onDelete: vi.fn(), onUpdate: vi.fn(), onAdd: vi.fn() };
    const { rerender } = render(
      <CalendarTab
        events={[]}
        editMode={false}
        eventHandlers={handlers}
        tags={[]}
        societyId={1}
        isMember={true}
        societyName="Chess"
      />,
    );
    fireEvent.click(screen.getByText('click-event'));
    expect(screen.getByTestId('detail-popup')).toBeInTheDocument();
    rerender(
      <CalendarTab
        events={[]}
        editMode={true}
        eventHandlers={handlers}
        tags={[]}
        societyId={1}
        isMember={true}
        societyName="Chess"
      />,
    );
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Edit'));
    expect(mockOpenModal).toHaveBeenCalledWith(monthViewClickEvent, 'society', monthViewClickEvent.start_time);
    mockConfirm.mockResolvedValueOnce(true);
    fireEvent.click(screen.getByText('Delete'));
    await waitFor(() => expect(handlers.onDelete).toHaveBeenCalled());
  });
});

