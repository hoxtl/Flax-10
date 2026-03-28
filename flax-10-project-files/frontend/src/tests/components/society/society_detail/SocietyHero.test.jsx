import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const { useReducedMotionMock } = vi.hoisted(() => ({
    useReducedMotionMock: vi.fn(() => false),
}));

vi.mock('framer-motion', async () => {
    const actual = await vi.importActual('framer-motion');
    return {
        ...actual,
        useReducedMotion: useReducedMotionMock,
    };
});

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
    beforeEach(() => {
        useReducedMotionMock.mockReturnValue(false);
    });

    function getHeroMedia(container) {
        return container.querySelector('[class*="heroMedia"]');
    }

    it('renders without crashing', () => {
        const { container } = render(
            <SocietyHero society={baseSociety} onImageClick={vi.fn()} editMode={false} />
        );
        expect(container.firstChild).toBeTruthy();
    });

    it('does not expose a hero click callback in non-edit mode', () => {
        const onImageClick = vi.fn();
        const { container } = render(
            <SocietyHero society={baseSociety} onImageClick={onImageClick} editMode={false} />
        );
        fireEvent.click(container.firstChild);
        expect(onImageClick).not.toHaveBeenCalled();
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
        const editLayer = screen.getByRole('button', { name: 'Click to Edit Cover Image' });
        fireEvent.click(editLayer);
        expect(onEditImages).toHaveBeenCalledOnce();
    });

    it('shows the member count chip and opens the member list when clicked', () => {
        const onViewMembers = vi.fn();
        render(<SocietyHero society={baseSociety} onImageClick={vi.fn()} onViewMembers={onViewMembers} editMode={false} />);
        fireEvent.click(screen.getByRole('button', { name: /view members: 42 members/i }));
        expect(onViewMembers).toHaveBeenCalledOnce();
    });

    it('renders the singular member label when there is exactly one member', () => {
        render(<SocietyHero society={{ ...baseSociety, member_count: 1 }} onImageClick={vi.fn()} editMode={false} />);
        expect(screen.getByRole('button', { name: 'View members: 1 member' })).toBeInTheDocument();
    });

    it('falls back to 0 members when member_count is missing', () => {
        const societyWithoutCount = { ...baseSociety };
        delete societyWithoutCount.member_count;
        render(<SocietyHero society={societyWithoutCount} onImageClick={vi.fn()} editMode={false} />);
        expect(screen.getByRole('button', { name: 'View members: 0 members' })).toBeInTheDocument();
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

    it('supports reduced motion by omitting motion layout ids', () => {
        useReducedMotionMock.mockReturnValue(true);
        const { container } = render(<SocietyHero society={baseSociety} onImageClick={vi.fn()} editMode={false} />);
        expect(getHeroMedia(container)).toBeTruthy();
        expect(screen.getByText('Chess Society')).toBeInTheDocument();
    });

    it('clears the hover-only image editor after mouse leave', () => {
        const { container } = render(
            <SocietyHero society={baseSociety} onImageClick={vi.fn()} editMode onEditImages={vi.fn()} />
        );
        fireEvent.mouseEnter(container.firstChild);
        expect(screen.getByRole('button', { name: 'Click to Edit Cover Image' })).toBeInTheDocument();
        fireEvent.mouseLeave(container.firstChild);
        expect(screen.queryByRole('button', { name: 'Click to Edit Cover Image' })).not.toBeInTheDocument();
    });

    it('does not set a background image when the society has no images', () => {
        const { container } = render(
            <SocietyHero
                society={{ ...baseSociety, image: null, cover_image: null, images: [] }}
                onImageClick={vi.fn()}
                editMode={false}
            />
        );
        expect(getHeroMedia(container)?.style.backgroundImage).toBe('');
    });

    it('renders meta content and prevents hero click propagation from the meta slot', () => {
        const onImageClick = vi.fn();
        render(
            <SocietyHero
                society={baseSociety}
                onImageClick={onImageClick}
                editMode={false}
                metaContent={<button type="button">Open Meta</button>}
            />
        );
        fireEvent.click(screen.getByRole('button', { name: 'Open Meta' }));
        expect(onImageClick).not.toHaveBeenCalled();
    });

    it('does not render a bio block when there is no bio and edit mode is off', () => {
        render(
            <SocietyHero
                society={{ ...baseSociety, bio: '' }}
                onImageClick={vi.fn()}
                editMode={false}
            />
        );
        expect(screen.queryByText('Add a short society bio...')).not.toBeInTheDocument();
        expect(document.querySelector('[class*="heroBioButton"]')).toBeNull();
    });

    it('lets editors cancel bio updates', () => {
        const onUpdateBio = vi.fn();
        render(<SocietyHero society={{ ...baseSociety, bio: null }} onImageClick={vi.fn()} editMode onUpdateBio={onUpdateBio} />);

        fireEvent.click(screen.getByRole('button', { name: /add a short society bio/i }));
        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveAttribute('placeholder', 'Describe your society...');

        fireEvent.change(textarea, { target: { value: 'Draft bio' } });
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        
        expect(onUpdateBio).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: /add a short society bio/i })).toBeInTheDocument();
    });

    it('lets editors save bio updates including a null bio', () => {
        const onUpdateBio = vi.fn();
        render(<SocietyHero society={{ ...baseSociety, bio: null }} onImageClick={vi.fn()} editMode onUpdateBio={onUpdateBio} />);

        fireEvent.click(screen.getByRole('button', { name: /add a short society bio/i }));
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Saved bio' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        expect(onUpdateBio).toHaveBeenCalledWith('Saved bio');
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /add a short society bio/i })).toBeInTheDocument();
    });

    it('stops bio edit clicks from bubbling to the hero image action', () => {
        const onImageClick = vi.fn();
        render(
            <SocietyHero
                society={baseSociety}
                onImageClick={onImageClick}
                editMode
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /a chess society/i }));
        expect(onImageClick).not.toHaveBeenCalled();
    });
});
