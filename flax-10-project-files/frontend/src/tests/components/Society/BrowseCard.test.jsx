import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BrowseCard from '../../../components/Society/BrowseCard';

describe('BrowseCard', () => {
    it('renders Find new society text', () => {
        render(<BrowseCard onClick={vi.fn()} />);
        expect(screen.getByText('🔎 Find new society')).toBeTruthy();
    });

    it('calls onClick when card is clicked', () => {
        const onClick = vi.fn();
        const { container } = render(<BrowseCard onClick={onClick} />);
        fireEvent.click(container.firstChild);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('renders empty grid when no societies', () => {
        render(<BrowseCard onClick={vi.fn()} societies={[]} />);
        // No image divs rendered
        expect(screen.queryAllByRole('img')).toHaveLength(0);
    });

    it('uses cover_image when available', () => {
        const societies = [
            { id: 1, cover_image: '/cover.jpg', image: null },
        ];
        const { container } = render(<BrowseCard onClick={vi.fn()} societies={societies} />);
        const gridItem = container.querySelector('[style*="/cover.jpg"]');
        expect(gridItem).toBeTruthy();
    });

    it('falls back to image when cover_image is null', () => {
        const societies = [
            { id: 1, cover_image: null, image: '/img.jpg' },
        ];
        const { container } = render(<BrowseCard onClick={vi.fn()} societies={societies} />);
        const gridItem = container.querySelector('[style*="/img.jpg"]');
        expect(gridItem).toBeTruthy();
    });

    it('renders at most 4 images', () => {
        const societies = Array.from({ length: 6 }, (_, i) => ({
            id: i, cover_image: `/img${i}.jpg`, image: null,
        }));
        const { container } = render(<BrowseCard onClick={vi.fn()} societies={societies} />);
        const gridItems = container.querySelectorAll('[class*="gridItem"]');
        expect(gridItems.length).toBeLessThanOrEqual(4);
    });
});
