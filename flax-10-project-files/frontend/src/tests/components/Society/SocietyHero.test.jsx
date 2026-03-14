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

    it('shows EditLayer and calls onEditImages when edit mode and hovered', () => {
        const onEditImages = vi.fn();
        const societyWithImages = {
            ...baseSociety,
            images: [{ url: 'https://example.com/img1.jpg' }, { url: 'https://example.com/img2.jpg' }],
        };
        const { container } = render(
            <SocietyHero society={societyWithImages} onImageClick={vi.fn()} editMode onEditImages={onEditImages} />
        );
        fireEvent.mouseEnter(container.firstChild);
        const editLayer = screen.getByText('Click to Edit Cover Images');
        fireEvent.click(editLayer);
        expect(onEditImages).toHaveBeenCalledOnce();
    });

    it('hides arrow buttons when only one image', () => {
        vi.mocked(useCarouselNavigation).mockReturnValue({ index: 0, prev: vi.fn(), next: vi.fn() });
        const { container } = render(
            <SocietyHero society={baseSociety} onImageClick={vi.fn()} editMode={false} />
        );
        fireEvent.mouseEnter(container.firstChild);
        const arrows = container.querySelectorAll('[class*="arrowBtn"]');
        expect(arrows.length).toBe(0);
    });

    it('shows image counter when multiple images', () => {
        const societyWithImages = {
            ...baseSociety,
            image: null,
            images: [{ url: 'https://example.com/img1.jpg' }, { url: 'https://example.com/img2.jpg' }],
        };
        render(<SocietyHero society={societyWithImages} onImageClick={vi.fn()} editMode={false} />);
        expect(screen.getByText(/2 photos/)).toBeTruthy();
    });

    it('EditableName: enter edit mode, change value, blur calls onUpdateName', async () => {
        const onUpdateName = vi.fn();
        const { container } = render(
            <SocietyHero society={baseSociety} onImageClick={vi.fn()} editMode onUpdateName={onUpdateName} />
        );
        const nameWrapper = container.querySelector('[class*="nameWrapper"]');
        fireEvent.click(nameWrapper);
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'New Name' } });
        fireEvent.blur(input);
        expect(onUpdateName).toHaveBeenCalledWith('New Name');
    });

    it('EditableName: Enter key blurs and triggers save', async () => {
        const onUpdateName = vi.fn();
        const { container } = render(
            <SocietyHero society={baseSociety} onImageClick={vi.fn()} editMode onUpdateName={onUpdateName} />
        );
        const nameWrapper = container.querySelector('[class*="nameWrapper"]');
        fireEvent.click(nameWrapper);
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'Updated' } });
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(onUpdateName).toHaveBeenCalledWith('Updated');
    });

    it('getImages merges society.image with images array and deduplicates', () => {
        const societyWithDupes = {
            ...baseSociety,
            image: 'https://example.com/same.jpg',
            images: [{ url: 'https://example.com/same.jpg' }],
        };
        const { container } = render(
            <SocietyHero society={societyWithDupes} onImageClick={vi.fn()} editMode={false} />
        );
        expect(container.firstChild).toBeTruthy();
    });

    it('arrow buttons call prev and next without propagating click', () => {
        const prev = vi.fn();
        const next = vi.fn();
        vi.mocked(useCarouselNavigation).mockReturnValue({ index: 1, prev, next });
        const societyWithImages = {
            ...baseSociety,
            images: [{ url: 'https://a.com/1.jpg' }, { url: 'https://a.com/2.jpg' }],
        };
        const { container } = render(
            <SocietyHero society={societyWithImages} onImageClick={vi.fn()} editMode={false} />
        );
        fireEvent.mouseEnter(container.firstChild);
        const leftBtn = container.querySelector('[class*="leftArrow"]');
        const rightBtn = container.querySelector('[class*="rightArrow"]');
        fireEvent.click(leftBtn);
        fireEvent.click(rightBtn);
        expect(prev).toHaveBeenCalledOnce();
        expect(next).toHaveBeenCalledOnce();
    });

    it('uses images[0] fallback when index out of bounds', () => {
        vi.mocked(useCarouselNavigation).mockReturnValue({ index: 99, prev: vi.fn(), next: vi.fn() });
        const societyWithImages = {
            ...baseSociety,
            image: null,
            images: [{ url: 'https://a.com/1.jpg' }],
        };
        const { container } = render(
            <SocietyHero society={societyWithImages} onImageClick={vi.fn()} editMode={false} />
        );
        expect(container.firstChild?.style?.backgroundImage).toContain('1.jpg');
    });

    it('EditableName: does not enter edit mode when editMode is false', () => {
        const { container } = render(
            <SocietyHero society={baseSociety} onImageClick={vi.fn()} editMode={false} />
        );
        const nameWrapper = container.querySelector('[class*="nameWrapper"]');
        fireEvent.click(nameWrapper);
        expect(screen.queryByRole('textbox')).toBeNull();
    });

    it('getImages handles null society.images', () => {
        const society = { ...baseSociety, images: null, image: 'x.jpg' };
        render(<SocietyHero society={society} onImageClick={vi.fn()} editMode={false} />);
        expect(screen.getByText('Chess Society')).toBeTruthy();
    });

    it('getImages handles images as plain strings without url property', () => {
        const society = { ...baseSociety, images: ['plain-url.jpg', 'another.jpg'], image: null };
        const { container } = render(<SocietyHero society={society} onImageClick={vi.fn()} editMode={false} />);
        expect(container.firstChild?.style?.backgroundImage).toContain('plain-url.jpg');
    });
});
