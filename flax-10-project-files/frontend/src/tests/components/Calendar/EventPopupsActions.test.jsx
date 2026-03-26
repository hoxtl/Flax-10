import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
vi.mock('../../../context/CalendarContext', () => ({
  useEventModal: vi.fn(), useEventPopup: vi.fn(), useCalendarDispatch: vi.fn(), useCalendar: vi.fn(() => ({})),
  useEventDelete: vi.fn(() => ({ openDelete: vi.fn(), isDeleteOpen: false }))
}));
vi.mock('../../../components/Calendar/hooks/useCalendarEvents', () => ({
  useCalendarEvents: vi.fn(() => ({ loadEvents: vi.fn() })),
  useEventActions: vi.fn(() => ({ removeEvent: vi.fn(), addException: vi.fn() }))
}));
vi.mock('../../../components/Calendar/event_modal/EventModal', () => ({ EventModal: () => <div data-testid="event-modal-mock" /> }));
vi.mock('../../../components/Calendar/event_popover/EventPopover', () => ({ EventPopover: ({ event, actions }) => (<div><span>{event?.title}</span>{actions?.map((a, i) => (<button key={i} onClick={a.onClick}>{a.label}</button>))}</div>) }));
vi.mock('../../../context/TagContext', () => ({ useTags: vi.fn(() => ({ refreshTags: vi.fn(), getTag: vi.fn() })) }));
vi.mock('../../../context/ToastContext', () => ({ useToast: vi.fn(() => vi.fn()) }));
vi.mock('../../../components/Calendar/utils/eventUtils', () => ({ getEventType: vi.fn(() => 'personal'), hasRecurrence: vi.fn(() => false) }));
import { EventPopups } from '../../../components/Calendar/EventPopups';
import { useEventModal, useEventPopup, useEventDelete } from '../../../context/CalendarContext';
import { useToast } from '../../../context/ToastContext';
import { useTags } from '../../../context/TagContext';
import { getEventType } from '../../../components/Calendar/utils/eventUtils';
const setupPopup = (evt, rO = false) => useEventPopup.mockReturnValue({ popupEvent: evt, popupAnchorRect: { top: 0, left: 0, width: 100, height: 30 }, closePopup: vi.fn(), readOnly: rO });
describe('EventPopups Generic', () => {
  const mockOpenD = vi.fn(), mockToast = vi.fn(), mockRefreshTags = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    useEventModal.mockReturnValue({ isModalOpen: false, openModal: vi.fn() });
    useEventDelete.mockReturnValue({ openDelete: mockOpenD, isDeleteOpen: false });
    useToast.mockReturnValue(mockToast);
    useTags.mockReturnValue({ refreshTags: mockRefreshTags, getTag: vi.fn() });
    getEventType.mockReturnValue('personal');
  });
  it('returns no actions for timetable events', () => {
    getEventType.mockReturnValue('timetable');
    setupPopup({ id: 8, title: 'CS', source: 'timetable' });
    render(<EventPopups />);
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });
  it('returns no actions when readOnly', () => {
    setupPopup({ id: 10, title: 'RO', source: 'personal' }, true);
    render(<EventPopups />);
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });
  it('Edit action calls openModal', () => {
    const oM = vi.fn();
    useEventModal.mockReturnValue({ isModalOpen: false, openModal: oM });
    const evt = { id: 17, title: 'P', source: 'personal' };
    setupPopup(evt);
    render(<EventPopups />);
    fireEvent.click(screen.getByText('Edit'));
    expect(oM).toHaveBeenCalledWith(evt);
  });
  it('Delete action calls openDelete', async () => {
    const evt = { id: 18, title: 'T', source: 'personal' };
    setupPopup(evt);
    render(<EventPopups />);
    fireEvent.click(screen.getByText('Delete'));
    await waitFor(() => expect(mockOpenD).toHaveBeenCalledWith(evt));
  });
  it('is not rendered when modal open', () => {
    useEventModal.mockReturnValue({ isModalOpen: true });
    setupPopup({ id: 2, title: 'P' });
    render(<EventPopups />);
    expect(screen.queryByText('P')).not.toBeInTheDocument();
  });
});
