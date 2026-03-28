import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ImageGalleryModal from '../../../../components/society/society_detail/image_handlers/ImageGalleryModal';

vi.mock(
  '../../../../components/society/society_detail/image_handlers/ImageGalleryModal.module.css',
  () => ({
    default: {
      overlay: 'overlay',
      modal: 'modal',
      closeBtn: 'closeBtn',
      image: 'image',
      nav: 'nav',
      navBtn: 'navBtn',
      dots: 'dots',
      dot: 'dot',
      activeDot: 'activeDot',
    },
  }),
);

vi.mock('../../../../components/society/hooks/useCarouselNavigation', () => {
  const state = { index: 0 };
  return {
    useCarouselNavigation: vi.fn((length, initial) => {
      state.index = initial ?? 0;
      return {
        index: state.index,
        prev: () => {
          state.index = (state.index - 1 + length) % length;
        },
        next: () => {
          state.index = (state.index + 1) % length;
        },
      };
    }),
    useCarouselGestures: vi.fn(),
    useCarouselKeyboard: vi.fn(),
  };
});

describe('ImageGalleryModal', () => {
  const images = ['a.jpg', 'b.jpg', 'c.jpg'];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when there are no images', () => {
    const { container } = render(<ImageGalleryModal images={[]} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders overlay, image and close button, and closes on overlay click', () => {
    const onClose = vi.fn();
    render(<ImageGalleryModal images={images} onClose={onClose} initialIndex={1} />);

    const overlay = document.body.querySelector('div[class*="_backdrop"]');
    expect(screen.getByAltText('Gallery')).toBeInTheDocument();

    expect(overlay).toBeTruthy();
    fireEvent.mouseDown(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  it('stops propagation when clicking inside modal and uses navigation buttons', () => {
    const onClose = vi.fn();
    const { container } = render(
      <ImageGalleryModal images={images} onClose={onClose} initialIndex={0} />,
    );

    const modal = document.body.querySelector('div.modal');
    expect(modal).toBeTruthy();
    fireEvent.click(modal);
    expect(onClose).not.toHaveBeenCalled();

    const navButtons = document.body.querySelectorAll('button.navBtn');
    expect(navButtons.length).toBe(2);
    const [prev, next] = navButtons;

    // clicking prev / next should not close modal and should keep dots rendered
    fireEvent.click(next);
    fireEvent.click(prev);
    expect(onClose).not.toHaveBeenCalled();
    expect(document.body.querySelectorAll('.dot').length).toBe(images.length);
  });

  it('does not render navigation when there is a single image', () => {
    render(<ImageGalleryModal images={['only.jpg']} onClose={vi.fn()} initialIndex={0} />);
    expect(document.body.querySelector('.nav')).toBeNull();
  });
});

