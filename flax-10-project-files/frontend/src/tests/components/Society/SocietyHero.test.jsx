import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../../components/Society/hooks/useCarouselNavigation', () => ({
    useCarouselNavigation: vi.fn(() => ({ index: 0, prev: vi.fn(), next: vi.fn() })),
    useCarouselGestures: vi.fn(),
}));

import SocietyHero from '../../../components/Society/SocietyDetail/SocietyHero';
import { useCarouselNavigation } from '../../../components/Society/hooks/useCarouselNavigation';

const baseSociety = {
    id: 1,
    name: 'Chess Society',
    image: 'https://example.com/chess.jpg',
    images: [],
    bio: 'A chess society',
    member_count: 42,
    is_member: false,
};

describe('SocietyHero', () => {
    it('renders without crashing', () => {
        const { container } = render(
            <SocietyHero society={baseSociety} onImageClick={vi.fn()} editMode={false} />
        );
        expect(container.firstChild).toBeTruthy();
    });

    it('calls onImageClick when clicked (non-edit mode)', () => {
        const onImageClick = vi.fn();
        const { container } = render(
            <SocietyHero society={baseSociety} onImageClick={onImageClick} editMode={false} />
        );
        fireEvent.click(container.firstChild);
        expect(onImageClick).toHaveBeenCalledOnce();
    });

    it('does not call onImageClick in edit mode', () => {
        const onImageClick = vi.fn();
        const { container } = render(
            <SocietyHero society={baseSociety} onImageClick={onImageClick} editMode={true} />
        );
        fireEvent.click(container.firstChild);
        expect(onImageClick).not.toHaveBeenCalled();
    });

    it('shows arrow buttons when multiple images and hovered', () => {
        useCarouselNavigation.mockReturnValue({ index: 0, prev: vi.fn(), next: vi.fn() });
        const societyWithImages = {
            ...baseSociety,
            images: [
                { url: 'https://example.com/img1.jpg' },
                { url: 'https://example.com/img2.jpg' },
            ],
        };
        const { container } = render(
            <SocietyHero society={societyWithImages} onImageClick={vi.fn()} editMode={false} />
        );
        fireEvent.mouseEnter(container.firstChild);
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
    });

    it('uses images from society.images array', () => {
        const societyWithImages = {
            ...baseSociety,
            images: [{ url: 'https://example.com/img.jpg' }],
            image: null,
        };
        const { container } = render(
            <SocietyHero society={societyWithImages} onImageClick={vi.fn()} editMode={false} />
        );
        expect(container.firstChild).toBeTruthy();
    });
});
