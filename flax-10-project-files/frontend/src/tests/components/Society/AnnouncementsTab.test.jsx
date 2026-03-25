import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AnnouncementsTab from '../../../components/Society/SocietyDetail/tabs/announcementTab/AnnouncementsTab';
import * as Mocks from './societyTestMocks';

vi.mock('../../../components/Calendar/utils/dateUtils', () => ({
  formatShortDate: () => 'Mar 9',
}));

vi.mock('../../../components/Society/SocietyDetail/imageHandlers/ImageGalleryModal', () => ({
  default: ({ onClose }) => (
    <div data-testid="gallery-modal">
      <button onClick={onClose}>close</button>
    </div>
  ),
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
    expect(screen.getByAltText('Announcement')).toBeTruthy();
  });

  it('handles gallery open and close', () => {
    renderTab({ announcements: announcementsWithMedia });
    fireEvent.click(screen.getByAltText('Announcement'));
    expect(screen.getByTestId('gallery-modal')).toBeTruthy();
    fireEvent.click(screen.getByText('close'));
    expect(screen.queryByTestId('gallery-modal')).toBeNull();
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
    vi.useRealTimers();
  });

  it('renders the empty-state copy for view and edit modes', () => {
    const { rerender } = renderTab({ announcements: [], editMode: false });
    expect(screen.getByText('No announcements yet.')).toBeTruthy();

    rerender(<AnnouncementsTab tags={[]} announcements={[]} editMode={true} />);
    expect(screen.getByText('No announcements yet. Use the sidebar to add one.')).toBeTruthy();
  });

  it('opens the gallery from a multi-image announcement and hides edit controls in view mode', () => {
    renderTab({ announcements: announcementsWithMedia, editMode: false });
    fireEvent.click(screen.getByAltText('Image 2'));
    expect(screen.getByTestId('gallery-modal')).toBeTruthy();
    expect(screen.queryByTitle('Edit')).toBeNull();
  });
});
