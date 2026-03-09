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
  MonthView: ({ onEventClick, onMoreClick, readOnly }) => (
    <div>
      <div>readOnly:{String(!!readOnly)}</div>
      <button type="button" onClick={() => onEventClick?.(monthViewClickEvent, { left: 0, top: 0 })}>
        click-event
      </button>
      <button type="button" onClick={() => onMoreClick?.(new Date('2026-03-09T00:00:00Z'))}>
        more
      </button>
    </div>
  ),
}));

vi.mock('../../../components/Calendar/header/DatePickerButton', () => ({
  DatePickerButton: ({ onDatePick }) => <button type="button" onClick={() => onDatePick(new Date('2026-02-01T00:00:00Z'))}>pick-date</button>,
}));

vi.mock('../../../components/Calendar/utils/dateUtils', () => ({
  addMonths: (d) => d,
  formatMonthYear: () => 'March 2026',
}));

vi.mock('../../../components/Calendar/utils/recurrenceUtils', () => ({
  expandRecurringEvents: (events) => events,
}));

vi.mock('../../../components/Calendar/utils/eventUtils', () => ({
  hasRecurrence: (e) => !!e?.recurrence_rule,
  extractBaseEventId: (id) => String(id).split('-')[0],
}));

vi.mock('../../../components/Society/SocietyDetail/tabs/tags/TagFilterBar', () => ({
  default: () => <div>TagFilterBar</div>,
}));
vi.mock('../../../components/Society/SocietyDetail/tabs/tags/TagManager', () => ({
  default: () => <div>TagManager</div>,
}));
vi.mock('../../../components/Society/SocietyDetail/tabs/calendarTab/SyncButton', () => ({
  default: () => <div>SyncButton</div>,
}));

vi.mock('../../../components/Calendar/EventModal/EventModal', () => ({
  EventModal: ({ onDelete, onSubmit }) => (
    <div data-testid="event-modal">
      <button type="button" onClick={() => onSubmit?.({ title: 'Updated' })}>submit</button>
      <button type="button" onClick={() => onDelete?.()}>delete</button>
    </div>
  ),
}));

vi.mock('../../../components/Calendar/EventDetailPopup', () => ({
  EventDetailPopup: ({ actions }) => (
    <div data-testid="detail-popup">
      {actions?.map((a) => (
        <button key={a.label} type="button" onClick={a.onClick}>
          {a.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('../../../components/Calendar/EventsSummaryModal/EventsSummaryModal', () => ({
  EventsSummaryModal: ({ isOpen }) => (isOpen ? <div data-testid="summary-modal">Summary</div> : null),
}));

import CalendarTab from '../../../components/Society/SocietyDetail/tabs/calendarTab/CalendarTab';

describe('Society detail CalendarTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});

