/**
 * Tests for announcement list rendering and edit callbacks.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AnnouncementsTab, { saveAnnouncement } from '../../../components/Society/SocietyDetail/tabs/announcementTab/AnnouncementsTab';

vi.mock('../../../components/Calendar/utils/dateUtils', () => ({
  formatShortDate: () => 'Mar 9',
}));

describe('AnnouncementsTab', () => {
  const announcementsWithMedia = [
    {
      id: 1,
      title: 'Single Image',
      content: 'Body 1',
      tag: 3,
      pinned: true,
      created_at: '2026-03-09T10:00:00Z',
      images: ['a.jpg'],
    },
    {
      id: 2,
      title: 'Multi Image',
      content: 'Body 2',
      created_at: '2026-03-09T10:00:00Z',
      images: [{ url: 'b.jpg' }, { url: 'c.jpg' }],
    },
  ];

  const renderTab = (props = {}) =>
    render(<AnnouncementsTab tags={[{ id: 3, label: 'Urgent', color: '#f00' }]} announcements={[]} editMode={false} {...props} />);

  beforeEach(() => {
    vi.clearAllMocks();
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it('renders empty states for edit and non-edit modes', () => {
    const { rerender } = render(<AnnouncementsTab announcements={[]} editMode={false} />);
    expect(screen.getByText('No announcements yet.')).toBeTruthy();

    rerender(<AnnouncementsTab announcements={[]} editMode />);
    expect(screen.getByText('No announcements yet. Use the sidebar to add one.')).toBeTruthy();
  });

  it('renders cards, images, tag badge, pinned badge and edit callback', () => {
    const onEdit = vi.fn();
    renderTab({ onEdit, editMode: true, announcements: announcementsWithMedia });

    expect(screen.getByText('Single Image')).toBeTruthy();
    expect(screen.getByText('Pinned')).toBeTruthy();
    expect(screen.getByText('Urgent')).toBeTruthy();
    expect(screen.getAllByText('Mar 9').length).toBe(2);
    expect(screen.getByAltText('Announcement')).toBeTruthy();
    expect(screen.getByAltText('Image 1')).toBeTruthy();
    expect(screen.getByAltText('Image 2')).toBeTruthy();
  });

  it('invokes edit callback from announcement card', () => {
    const onEdit = vi.fn();
    renderTab({ editMode: true, onEdit, announcements: announcementsWithMedia });

    fireEvent.click(screen.getAllByTitle('Edit')[0]);
    expect(onEdit).toHaveBeenCalled();
  });

  it('handles focus highlight and scroll behavior', async () => {
    vi.useFakeTimers();

    render(
      <AnnouncementsTab
        announcements={[{ id: 99, title: 'Focus me', content: 'x', created_at: '2026-03-09T10:00:00Z' }]}
        focusAnnouncementId={99}
      />,
    );

    const card = document.getElementById('announcement-99');
    expect(card).toBeTruthy();
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();

    vi.advanceTimersByTime(2100);
    vi.useRealTimers();
  });

  describe('saveAnnouncement', () => {
    it('calls onUpdate when data has id', () => {
      const handlers = { onUpdate: vi.fn(), onAdd: vi.fn() };
      saveAnnouncement({ id: 5, title: 'X' }, handlers, null);
      expect(handlers.onUpdate).toHaveBeenCalledWith(5, { id: 5, title: 'X' });
      expect(handlers.onAdd).not.toHaveBeenCalled();
    });

    it('calls onAdd when data has no id', () => {
      const handlers = { onUpdate: vi.fn(), onAdd: vi.fn() };
      saveAnnouncement({ title: 'New' }, handlers, null);
      expect(handlers.onAdd).toHaveBeenCalledWith({ title: 'New' });
      expect(handlers.onUpdate).not.toHaveBeenCalled();
    });

    it('unpins conflicting announcement then updates current when conflict provided', () => {
      const handlers = { onUpdate: vi.fn(), onAdd: vi.fn() };
      const conflict = { id: 1, title: 'Old Pin', pinned: true };
      saveAnnouncement({ id: 2, title: 'New Pin', pinned: true }, handlers, conflict);
      expect(handlers.onUpdate).toHaveBeenCalledWith(1, { id: 1, title: 'Old Pin', pinned: false });
      expect(handlers.onUpdate).toHaveBeenCalledWith(2, { id: 2, title: 'New Pin', pinned: true });
    });

    it('handles missing handlers gracefully', () => {
      expect(() => saveAnnouncement({ id: 1 }, undefined, null)).not.toThrow();
      expect(() => saveAnnouncement({ id: 1 }, {}, null)).not.toThrow();
    });
  });
});
