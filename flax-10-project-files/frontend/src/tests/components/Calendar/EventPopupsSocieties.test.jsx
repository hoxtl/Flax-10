import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../../../context/CalendarContext', () => ({
  useEventModal: vi.fn(() => ({ isModalOpen: false })), useEventPopup: vi.fn(), useCalendarDispatch: vi.fn(), useCalendar: vi.fn(() => ({})),
  useEventDelete: vi.fn(() => ({ isDeleteOpen: false }))
}));
vi.mock('../../../components/calendar/hooks/useCalendarEvents', () => ({
  useCalendarEvents: vi.fn(() => ({ loadEvents: vi.fn() })),
  useEventActions: vi.fn(() => ({ removeEvent: vi.fn(), addException: vi.fn() }))
}));
vi.mock('../../../context/TagContext', () => ({ useTags: vi.fn(() => ({ refreshTags: vi.fn(), getTag: vi.fn() })) }));
vi.mock('../../../context/ToastContext', () => ({ useToast: vi.fn(() => vi.fn()) }));
vi.mock('../../../api/societyApi', () => ({ unsyncCalendar: vi.fn() }));
vi.mock('../../../components/calendar/event_modal/EventModal', () => ({ EventModal: () => <div data-testid="event-modal-mock" /> }));
vi.mock('../../../components/calendar/event_popover/EventPopover', () => ({ EventPopover: ({ event, actions, tag }) => (<div data-testid="event-popup"><span>{event?.title}</span>{tag && <span data-testid="popup-tag">{tag.label}</span>}{actions?.map((a, i) => (<button key={i} onClick={a.onClick}>{a.label}</button>))}</div>) }));
vi.mock('../../../components/calendar/utils/eventUtils', () => ({ getEventType: vi.fn(() => 'society'), hasRecurrence: vi.fn(() => false) }));
import { EventPopups } from '../../../components/calendar/EventPopups';
import { useEventPopup } from '../../../context/CalendarContext';
import { useToast } from '../../../context/ToastContext';
import { unsyncCalendar } from '../../../api/societyApi';
const setupPopup = (evt) => useEventPopup.mockReturnValue({ popupEvent: evt, popupAnchorRect: { top: 0, left: 0, width: 100, height: 30 }, closePopup: vi.fn(), readOnly: false });
describe('EventPopups Societies', () => {
  const mockToast = vi.fn();
  beforeEach(() => { vi.clearAllMocks(); useToast.mockReturnValue(mockToast); });
  it('society events show only Unsync action', () => {
    setupPopup({ id: 7, title: 'Soc P', source: 'society', society_id: 10 });
    render(<EventPopups />);
    expect(screen.getByText('Unsync')).toBeInTheDocument();
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });
  it('uses tag_name and tag_color from society event', () => {
    setupPopup({ id: 11, title: 'Soc M', source: 'society', tag_name: 'Eng', tag_color: '#f50' });
    render(<EventPopups />);
    expect(screen.getByTestId('popup-tag').textContent).toBe('Eng');
  });
  it('Unsync action calls unsyncCalendar', async () => {
    setupPopup({ id: 16, title: 'Drama', source: 'society', society_id: 's1', society_name: 'DC' });
    render(<EventPopups />);
    fireEvent.click(screen.getByText('Unsync'));
    await waitFor(() => expect(unsyncCalendar).toHaveBeenCalledWith('s1'));
    expect(mockToast).toHaveBeenCalledWith('Unsynced DC');
  });
});
