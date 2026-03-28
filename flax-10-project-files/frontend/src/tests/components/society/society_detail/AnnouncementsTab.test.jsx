import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AnnouncementsTab from '../../../../components/society/society_detail/tabs/announcement_tab/AnnouncementsTab';

vi.mock('../../../../components/calendar/utils/dateUtils', () => ({
  formatShortDate: () => 'Mar 9',
}));

describe('AnnouncementsTab', () => {
  const announcementsWithMedia = [
    {
      id: 1, title: 'S1', content: 'B1', tag: 3, pinned: true,
      created_at: '2026-03-09T10:00:00Z', images: ['a.jpg']
    },
    {
      id: 2, title: 'Multi', content: 'B2',
      created_at: '2026-03-09T10:00:00Z', images: [{ url: 'b.jpg' }, { url: 'c.jpg' }]
    },
    {
      id: 3, title: 'Text only', content: 'B3',
      created_at: '2026-03-09T10:00:00Z'
    },
  ];

  const renderTab = (props = {}) =>
    render(<AnnouncementsTab tags={[{ id: 3, label: 'Urgent', color: '#f00' }]} announcements={[]} editMode={false} {...props} />);

  beforeEach(() => {
    vi.clearAllMocks();
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it('renders cards and images', () => {
    renderTab({ announcements: announcementsWithMedia });
    expect(screen.getByText('S1')).toBeTruthy();
    expect(screen.getByText('Pinned')).toBeTruthy();
    const images = screen.getAllByAltText('Announcement');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src', 'a.jpg');
    expect(images[1]).toHaveAttribute('src', 'b.jpg');
    expect(screen.queryByAltText('Text only')).toBeNull();
  });

  it('handles edit callback', () => {
    const onEdit = vi.fn();
    renderTab({ editMode: true, onEdit, announcements: announcementsWithMedia });
    fireEvent.click(screen.getAllByTitle('Edit')[0]);
    expect(onEdit).toHaveBeenCalled();
  });

  it('handles focus scroll', () => {
    vi.useFakeTimers();
    renderTab({ announcements: [{ id: 99, title: 'F', content: 'x' }], focusAnnouncementId: 99 });
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    vi.useRealTimers();
  });

  it('renders the empty-state copy for view and edit modes', () => {
    const { rerender } = renderTab({ announcements: [], editMode: false });
    expect(screen.getByText('No announcements yet')).toBeTruthy();
    expect(screen.getByText('Check back soon for society updates, reminders, and event news.')).toBeTruthy();

    rerender(<AnnouncementsTab tags={[]} announcements={[]} editMode={true} />);
    expect(screen.getByText('Use the sidebar to post the first update for this society.')).toBeTruthy();
  });

  it('uses the first announcement image and hides edit controls in view mode', () => {
    renderTab({ announcements: announcementsWithMedia, editMode: false });
    const [singleImage, multiImage] = screen.getAllByRole('img');
    expect(singleImage).toHaveAttribute('src', 'a.jpg');
    expect(multiImage).toHaveAttribute('src', 'b.jpg');
    expect(screen.queryByTitle('Edit')).toBeNull();
  });

  it('uses the default empty announcements prop when none is provided', () => {
    render(<AnnouncementsTab editMode={false} tags={[]} />);
    expect(screen.getByText('No announcements yet')).toBeInTheDocument();
  });

  it('renders announcement cards when tags are omitted', () => {
    render(<AnnouncementsTab editMode={false} announcements={[announcementsWithMedia[0]]} />);
    expect(screen.getByText('S1')).toBeInTheDocument();
    expect(screen.queryByText('Urgent')).not.toBeInTheDocument();
  });
});
