import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrev = vi.fn();
const mockNext = vi.fn();

vi.mock('../../../components/Society/hooks/useCarouselNavigation', () => ({
    useCarouselNavigation: vi.fn(() => ({ index: 0, prev: mockPrev, next: mockNext })),
    useCarouselGestures: vi.fn(),
    useCarouselKeyboard: vi.fn(),
}));

import ImageGalleryModal from '../../../components/Society/SocietyDetail/imageHandlers/ImageGalleryModal';
import { useCarouselNavigation, useCarouselKeyboard } from '../../../components/Society/hooks/useCarouselNavigation';

describe('ImageGalleryModal', () => {
    const images = ['img1.jpg', 'img2.jpg', 'img3.jpg'];
    const onClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        useCarouselNavigation.mockReturnValue({ index: 0, prev: mockPrev, next: mockNext });
    });

    it('returns null when images array is empty', () => {
        const { container } = render(<ImageGalleryModal images={[]} onClose={onClose} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders with single image and no navigation', () => {
        useCarouselNavigation.mockReturnValue({ index: 0, prev: mockPrev, next: mockNext });
        render(<ImageGalleryModal images={['solo.jpg']} onClose={onClose} />);
        expect(screen.getByRole('img')).toBeTruthy();
        expect(screen.queryByRole('button', { name: /←|→/ })).toBeNull();
    });

    it('renders with multiple images and shows navigation', () => {
        render(<ImageGalleryModal images={images} onClose={onClose} />);
        expect(screen.getByRole('img')).toBeTruthy();
        const buttons = screen.getAllByRole('button');
        // close button + prev + next = 3 buttons
        expect(buttons.length).toBeGreaterThanOrEqual(3);
    });

    it('calls onClose when overlay is clicked', () => {
        const { container } = render(<ImageGalleryModal images={images} onClose={onClose} />);
        fireEvent.click(container.firstChild);
        expect(onClose).toHaveBeenCalled();
    });

    it('does not call onClose when modal content is clicked', () => {
        const { container } = render(<ImageGalleryModal images={images} onClose={onClose} />);
        const modal = container.firstChild.firstChild;
        fireEvent.click(modal);
        expect(onClose).not.toHaveBeenCalled();
    });

    it('calls onClose when close button is clicked', () => {
        render(<ImageGalleryModal images={images} onClose={onClose} />);
        const closeBtn = screen.getByRole('button', { name: '×' });
        fireEvent.click(closeBtn);
        expect(onClose).toHaveBeenCalled();
    });

    it('displays current image based on carousel index', () => {
        useCarouselNavigation.mockReturnValue({ index: 1, prev: mockPrev, next: mockNext });
        render(<ImageGalleryModal images={images} onClose={onClose} />);
        const img = screen.getByRole('img');
        expect(img.getAttribute('src')).toBe('img2.jpg');
    });

    it('uses initialIndex prop for carousel', () => {
        render(<ImageGalleryModal images={images} onClose={onClose} initialIndex={2} />);
        expect(useCarouselNavigation).toHaveBeenCalledWith(3, 2);
    });

    it('passes default initialIndex of 0 when not provided', () => {
        render(<ImageGalleryModal images={images} onClose={onClose} />);
        expect(useCarouselNavigation).toHaveBeenCalledWith(3, 0);
    });

    it('renders navigation dots equal to image count', () => {
        const { container } = render(<ImageGalleryModal images={images} onClose={onClose} />);
        const dots = container.querySelectorAll('span');
        expect(dots.length).toBe(images.length);
    });

    it('applies active dot class to current index dot', () => {
        useCarouselNavigation.mockReturnValue({ index: 1, prev: mockPrev, next: mockNext });
        const { container } = render(<ImageGalleryModal images={images} onClose={onClose} />);
        const dots = Array.from(container.querySelectorAll('span'));
        // active dot at index 1 should have activeDot class
        expect(dots[1].className).toContain('activeDot');
        expect(dots[0].className).not.toContain('activeDot');
    });

    it('sets up keyboard handler via useCarouselKeyboard', () => {
        render(<ImageGalleryModal images={images} onClose={onClose} />);
        expect(useCarouselKeyboard).toHaveBeenCalledWith(mockPrev, mockNext, onClose);
    });

    it('image has alt text "Gallery"', () => {
        render(<ImageGalleryModal images={images} onClose={onClose} />);
        expect(screen.getByAltText('Gallery')).toBeTruthy();
    });
});
