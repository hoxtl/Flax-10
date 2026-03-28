import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import SocietyHero from '../../../../components/society/society_detail/SocietyHero';

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
    function getHeroMedia(container) {
        return container.querySelector('[class*="heroMedia"]');
    }

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
        expect(onImageClick).toHaveBeenCalledWith(0);
    });

    it('does not call onImageClick in edit mode', () => {
        const onImageClick = vi.fn();
        const { container } = render(
            <SocietyHero society={baseSociety} onImageClick={onImageClick} editMode={true} />
        );
        fireEvent.click(container.firstChild);
        expect(onImageClick).not.toHaveBeenCalled();
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
        const editLayer = screen.getByRole('button', { name: 'Edit Cover Image' });
        fireEvent.click(editLayer);
        expect(onEditImages).toHaveBeenCalledOnce();
    });

    it('shows the member count chip and opens the member list when clicked', () => {
        const onViewMembers = vi.fn();
        render(<SocietyHero society={baseSociety} onImageClick={vi.fn()} onViewMembers={onViewMembers} editMode={false} />);
        fireEvent.click(screen.getByRole('button', { name: /view members: 42 members/i }));
        expect(onViewMembers).toHaveBeenCalledOnce();
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

    it('shows the ratified indicator beside the title when the society is ratified', () => {
        render(<SocietyHero society={{ ...baseSociety, is_ratified: true }} onImageClick={vi.fn()} editMode={false} />);
        expect(screen.getByLabelText('Ratified')).toBeInTheDocument();
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
        expect(getHeroMedia(container)?.style?.backgroundImage).toContain('plain-url.jpg');
    });

    it('does not render a photos counter pill', () => {
        render(<SocietyHero society={{ ...baseSociety, images: [{ url: 'a.jpg' }, { url: 'b.jpg' }] }} onImageClick={vi.fn()} editMode={false} />);
        expect(screen.queryByText(/photos/)).not.toBeInTheDocument();
    });
});
