import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
const { mockConfirm, mockToast, delOccur } = vi.hoisted(() => ({ mockConfirm: vi.fn(), mockToast: vi.fn(), delOccur: vi.fn(() => Promise.resolve()) }));
vi.mock('../../../../context/CalendarContext', () => ({
  useEventModal: vi.fn(() => ({ isModalOpen: false })), useEventPopup: vi.fn(), useCalendarDispatch: vi.fn(), useCalendar: vi.fn(() => ({})),
  useEventDelete: vi.fn()
}));
vi.mock('../../../../components/calendar/hooks/useCalendarEvents', () => ({
  useCalendarEvents: vi.fn(() => ({ loadEvents: vi.fn() })),
  useEventActions: vi.fn(() => ({ removeEvent: vi.fn(), addException: vi.fn() }))
}));
vi.mock('../../../../context/ConfirmContext', () => ({ useConfirm: () => mockConfirm }));
vi.mock('../../../../context/ToastContext', () => ({ useToast: () => mockToast }));
vi.mock('../../../../context/TagContext', () => ({ useTags: () => ({ refreshTags: vi.fn(), getTag: vi.fn() }) }));
vi.mock('../../../../components/calendar/event_modal/EventModal', () => ({ EventModal: () => <div data-testid="event-modal-mock" /> }));
vi.mock('../../../../components/calendar/utils/formUtils', () => ({ deleteRecurrenceOccurrence: delOccur }));
vi.mock('../../../../components/common/hold_confirm_modal/HoldConfirmModal', () => ({ default: ({ title, onConfirm }) => (<div><span>{title}</span><button onClick={onConfirm}>Confirm Hold</button></div>) }));
vi.mock('../../../../components/calendar/utils/eventUtils', () => ({ getEventType: vi.fn(() => 'personal'), hasRecurrence: vi.fn(() => true) }));
vi.mock('../../../../components/calendar/event_popover/EventPopover', () => ({ EventPopover: ({ event, actions }) => (<div><span>{event?.title}</span>{actions?.map((a, i) => (<button key={i} onClick={a.onClick}>{a.label}</button>))}</div>) }));
import { EventPopups } from '../../../../components/calendar/EventPopups';
import { useEventPopup, useEventDelete } from '../../../../context/CalendarContext';
const setupPopup = (evt) => useEventPopup.mockReturnValue({ popupEvent: evt, popupAnchorRect: { top: 0, left: 0, width: 100, height: 30 }, closePopup: vi.fn(), readOnly: false });
describe('EventPopups Recurring', () => {
  beforeEach(() => vi.clearAllMocks());
  it('sends recurring deletes through alternate branch', async () => {
    const oD = vi.fn();
    useEventDelete.mockReturnValue({ openDelete: oD, isDeleteOpen: false });
    mockConfirm.mockResolvedValueOnce('ALTERNATE');
    setupPopup({ id: 19, title: 'Study', source: 'personal' });
    render(<EventPopups />);
    fireEvent.click(screen.getByText('Delete'));
    await waitFor(() => expect(oD).toHaveBeenCalledWith(expect.anything(), 'occurrence'));
  });

  it('runs recurring occurrence delete flow', async () => {
    const evt = { id: 20, title: 'Recur', source: 'personal' };
    useEventDelete.mockReturnValue({ isDeleteOpen: true, deleteEvent: evt, deleteType: 'occurrence', closeDelete: vi.fn() });
    setupPopup(evt);
    render(<EventPopups />);
    fireEvent.click(screen.getByText('Confirm Hold'));
    await waitFor(() => {
      expect(delOccur).toHaveBeenCalledWith(evt, expect.anything());
      expect(mockToast).toHaveBeenCalledWith('"Recur" deleted.');
    });
  });
});
