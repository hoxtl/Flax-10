import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AnnouncementsTab from '../../../components/Society/SocietyDetail/tabs/announcementTab/AnnouncementsTab';

vi.mock('../../../components/Calendar/utils/dateUtils', () => ({
  formatShortDate: () => 'Mar 9',
}));

describe('AnnouncementsTab', () => {
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

    render(
      <AnnouncementsTab
        editMode
        onEdit={onEdit}
        tags={[{ id: 3, label: 'Urgent', color: '#f00' }]}
        announcements={[
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
        ]}
      />,
    );

    expect(screen.getByText('Single Image')).toBeTruthy();
    expect(screen.getByText('Pinned')).toBeTruthy();
    expect(screen.getByText('Urgent')).toBeTruthy();
    expect(screen.getAllByText('Mar 9').length).toBe(2);
    expect(screen.getByAltText('Announcement')).toBeTruthy();
    expect(screen.getByAltText('Image 1')).toBeTruthy();
    expect(screen.getByAltText('Image 2')).toBeTruthy();

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
});
