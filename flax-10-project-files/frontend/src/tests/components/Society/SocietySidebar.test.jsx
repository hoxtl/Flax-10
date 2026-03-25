import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SocietySidebar from '../../../components/Society/SocietyDetail/SocietySidebar';

vi.mock('../../../components/Calendar/utils/dateUtils', () => ({
  formatDateTime: () => 'Formatted Date',
}));

vi.mock('../../../components/Society/SocietyDetail/tabs/announcementTab/AnnouncementModal', () => ({
  default: ({ onClose, onSubmit, announcements }) => (
    <div>
      <button onClick={() => onSubmit({ title: 'new-announcement' }, announcements?.find((a) => a.pinned))}>submit-announcement</button>
      <button onClick={onClose}>close-announcement</button>
    </div>
  ),
}));

vi.mock('../../../components/Calendar/EventModal/EventModal', () => ({
  EventModal: ({ onSubmit, onClose }) => (
    <div>
      <button onClick={() => onSubmit({ title: 'new-event' })}>submit-event</button>
      <button onClick={onClose}>close-event</button>
    </div>
  ),
}));

function baseSociety(overrides = {}) {
  return {
    id: 1,
    announcements: [],
    events: [],
    ...overrides,
  };
}

describe('SocietySidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no pinned items or events and not in edit mode', () => {
    render(<SocietySidebar society={baseSociety()} editMode={false} tags={[]} />);
    expect(screen.getByText('No pinned items or upcoming events.')).toBeTruthy();
  });

  it('renders pinned announcement and upcoming event', () => {
    render(
      <SocietySidebar
        society={baseSociety({
          announcements: [{ id: 3, title: 'Pinned Title', content: 'Pinned content', pinned: true }],
          events: [{ id: 9, title: 'Soc Event', start_time: '2026-03-10T12:00:00Z' }],
        })}
        editMode={false}
        tags={[]}
      />,
    );

    expect(screen.getByText('Pinned')).toBeTruthy();
    expect(screen.getByText('Pinned Title')).toBeTruthy();
    expect(screen.getByText('Up Next')).toBeTruthy();
    expect(screen.getByText('Soc Event')).toBeTruthy();
    expect(screen.getByText('Formatted Date')).toBeTruthy();
  });

  it('handles announcement submit flow and unpins conflicting announcement', async () => {
    const onUpdateAnnouncement = vi.fn();
    const onAddAnnouncement = vi.fn();

    render(
      <SocietySidebar
        society={baseSociety({
          announcements: [{ id: 10, title: 'Existing', content: 'c', pinned: true }],
        })}
        editMode
        onUpdateAnnouncement={onUpdateAnnouncement}
        onAddAnnouncement={onAddAnnouncement}
        tags={[]}
      />,
    );

    fireEvent.click(screen.getByText('+ Add Announcement'));
    fireEvent.click(await screen.findByText('submit-announcement'));

    expect(onUpdateAnnouncement).toHaveBeenCalledWith(10, expect.objectContaining({ pinned: false }));
    expect(onAddAnnouncement).toHaveBeenCalledWith({ title: 'new-announcement' });

    await waitFor(() => expect(screen.queryByText('submit-announcement')).toBeNull());
  });

  it('handles event modal submit flow', async () => {
    const onAddEvent = vi.fn();

    render(<SocietySidebar society={baseSociety()} editMode onAddEvent={onAddEvent} tags={[]} />);

    fireEvent.click(screen.getByText('+ Add Event'));
    fireEvent.click(await screen.findByText('submit-event'));

    expect(onAddEvent).toHaveBeenCalledWith({ title: 'new-event' });
    await waitFor(() => expect(screen.queryByText('submit-event')).toBeNull());
  });

  it('closes the event modal even when no add-event handler is provided', async () => {
    render(<SocietySidebar society={baseSociety()} editMode tags={[]} />);

    fireEvent.click(screen.getByText('+ Add Event'));
    fireEvent.click(await screen.findByText('submit-event'));

    await waitFor(() => expect(screen.queryByText('submit-event')).toBeNull());
  });

  it('closes the event modal without submitting a new event', async () => {
    render(<SocietySidebar society={baseSociety()} editMode tags={[]} />);

    fireEvent.click(screen.getByText('+ Add Event'));
    fireEvent.click(await screen.findByText('close-event'));

    await waitFor(() => expect(screen.queryByText('submit-event')).toBeNull());
  });

  it('announcement submit without conflicting pinned does not call onUpdateAnnouncement', async () => {
    const onAddAnnouncement = vi.fn();
    const onUpdateAnnouncement = vi.fn();

    render(
      <SocietySidebar
        society={baseSociety({ announcements: [{ id: 1, title: 'A', content: 'c', pinned: false }] })}
        editMode
        onAddAnnouncement={onAddAnnouncement}
        onUpdateAnnouncement={onUpdateAnnouncement}
        tags={[]}
      />,
    );

    fireEvent.click(screen.getByText('+ Add Announcement'));
    fireEvent.click(await screen.findByText('submit-announcement'));

    expect(onAddAnnouncement).toHaveBeenCalledWith({ title: 'new-announcement' });
    expect(onUpdateAnnouncement).not.toHaveBeenCalled();
  });

  it('edit mode shows AddButtons even when no pinned or next event', () => {
    render(<SocietySidebar society={baseSociety()} editMode tags={[]} />);
    expect(screen.getByText('+ Add Announcement')).toBeTruthy();
    expect(screen.getByText('+ Add Event')).toBeTruthy();
  });
});
