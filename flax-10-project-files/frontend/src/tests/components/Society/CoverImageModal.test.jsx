import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import CoverImageModal from '../../../components/Society/SocietyDetail/imageHandlers/CoverImageModal';

vi.mock(
  '../../../components/Society/SocietyDetail/imageHandlers/ImageManagerComponents.module.css',
  () => ({
    default: {
      backdrop: 'backdrop',
      modal: 'modal',
      header: 'header',
      title: 'title',
      close: 'close',
      hint: 'hint',
      grid: 'grid',
      addCard: 'addCard',
      addIcon: 'addIcon',
      imageCard: 'imageCard',
      pinned: 'pinned',
      pinnedBadge: 'pinnedBadge',
      pinBtn: 'pinBtn',
      deleteBtn: 'deleteBtn',
      tabs: 'tabs',
      tab: 'tab',
      activeTab: 'activeTab',
      dropZone: 'dropZone',
      photoSelectGrid: 'photoSelectGrid',
      photoSelectCard: 'photoSelectCard',
      selected: 'selected',
      actions: 'actions',
      cancelBtn: 'cancelBtn',
      confirmBtn: 'confirmBtn',
    },
  }),
);

// Re-export actual child components while using the real implementation
// so that CoverImageModal behaviour is exercised end-to-end.

describe('CoverImageModal', () => {
  const originalAlert = window.alert;

  beforeEach(() => {
    vi.restoreAllMocks();
    window.alert = vi.fn();
  });

  afterEach(() => {
    window.alert = originalAlert;
  });

  const baseImages = ['a.jpg', 'b.jpg'];

  it('renders list view with header, hint and grid, and closes on backdrop mousedown', () => {
    const onClose = vi.fn();
    const onUpdate = vi.fn();

    render(
      <CoverImageModal
        images={baseImages}
        availablePhotos={[]}
        onClose={onClose}
        onUpdate={onUpdate}
      />,
    );

    expect(screen.getByText('Manage Cover Images')).toBeInTheDocument();
    expect(
      screen.getByText(/First image is shown on society card/i),
    ).toBeInTheDocument();

    // clicking inside modal should not close
    fireEvent.mouseDown(screen.getByText('Manage Cover Images'));
    expect(onClose).not.toHaveBeenCalled();

    // clicking backdrop should close
    fireEvent.mouseDown(screen.getByText('Manage Cover Images').closest('div.backdrop'));
    expect(onClose).toHaveBeenCalled();
  });

  it('pins and deletes images via ImageGrid handlers', () => {
    const onClose = vi.fn();
    const onUpdate = vi.fn();

    // Render with two images so pin / delete logic is meaningful
    const { container } = render(
      <CoverImageModal
        images={baseImages}
        availablePhotos={[]}
        onClose={onClose}
        onUpdate={onUpdate}
      />,
    );

    // Pin second image (★ button on non-main card)
    const pinButtons = container.querySelectorAll('button[title="Set as main"]');
    expect(pinButtons.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(pinButtons[0]);
    expect(onUpdate).toHaveBeenCalledWith(['b.jpg', 'a.jpg']);

    // Delete first image (× button on card)
    const deleteButtons = container.querySelectorAll('button');
    const deleteBtn = Array.from(deleteButtons).find(
      (btn) => btn.textContent === '×' && btn !== deleteButtons[0],
    );
    if (deleteBtn) fireEvent.click(deleteBtn);
    expect(onUpdate).toHaveBeenCalledWith(['b.jpg']);
  });

  it('switches to add view and back, and limits to 5 images with alert', () => {
    const onClose = vi.fn();
    const onUpdate = vi.fn();

    const manyImages = ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg'];
    const { rerender, container } = render(
      <CoverImageModal
        images={manyImages}
        availablePhotos={['x.jpg']}
        onClose={onClose}
        onUpdate={onUpdate}
      />,
    );

    // When grid is full, the add button should be disabled and have the tooltip
    const fullAddBtn = container.querySelector('button[title="Maximum 5 images reached"]');
    expect(fullAddBtn).toBeDisabled();

    // Now rerender with fewer images and open Add view via onAddClick
    rerender(
      <CoverImageModal
        images={['1.jpg', '2.jpg']}
        availablePhotos={['x.jpg']}
        onClose={onClose}
        onUpdate={onUpdate}
      />,
    );

    const addAvailableBtn = container.querySelector('button[title="Add image"]');
    fireEvent.click(addAvailableBtn);

    // In AddImageView, select From Photos tab and add selected
    fireEvent.click(screen.getByText('From Photos'));
    const photoCard = container.querySelector('.photoSelectCard');
    fireEvent.click(photoCard);
    fireEvent.click(screen.getByText('Add Selected'));

    expect(onUpdate).toHaveBeenCalledWith(['1.jpg', '2.jpg', 'x.jpg']);

    // Closing AddImageView via backdrop should return to list view
    fireEvent.mouseDown(container.firstChild);
    expect(onClose).toHaveBeenCalled();
  });
});
