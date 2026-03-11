import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmojiPicker from '../../../components/Tags/EmojiPicker';

// Mock frimousse EmojiPicker
const mockActiveEmoji = vi.fn();
vi.mock('frimousse', () => ({
    EmojiPicker: {
        Root: ({ children, className }) => <div className={className} data-testid="emoji-root">{children}</div>,
        Search: ({ className, placeholder }) => <input className={className} placeholder={placeholder} data-testid="emoji-search" />,
        Viewport: ({ children, className }) => <div className={className} data-testid="emoji-viewport">{children}</div>,
        Loading: ({ children, className }) => <div className={className} data-testid="emoji-loading">{children}</div>,
        Empty: ({ children, className }) => <div className={className} data-testid="emoji-empty">{children}</div>,
        List: ({ components, className }) => {
            const { Emoji, CategoryHeader, Row } = components || {};
            const mockEmoji = { emoji: '😀', label: 'grinning face' };
            const mockCategory = { label: 'Smileys' };
            return (
                <div className={className} data-testid="emoji-list">
                    {CategoryHeader && <CategoryHeader category={mockCategory} />}
                    {Row && <Row><span /></Row>}
                    {Emoji && <Emoji emoji={mockEmoji} />}
                </div>
            );
        },
        ActiveEmoji: ({ children }) => {
            const result = mockActiveEmoji();
            return <div data-testid="emoji-active">{children(result)}</div>;
        },
    },
}));

describe('EmojiPicker', () => {
    beforeEach(() => {
        mockActiveEmoji.mockReturnValue({ emoji: { emoji: '😀', label: 'grinning face' } });
    });

    it('renders the emoji picker root', () => {
        render(<EmojiPicker onSelect={vi.fn()} onClose={vi.fn()} />);
        expect(screen.getByTestId('emoji-root')).toBeTruthy();
    });

    it('renders search input with placeholder', () => {
        render(<EmojiPicker onSelect={vi.fn()} onClose={vi.fn()} />);
        expect(screen.getByPlaceholderText('Search emoji...')).toBeTruthy();
    });

    it('renders viewport', () => {
        render(<EmojiPicker onSelect={vi.fn()} onClose={vi.fn()} />);
        expect(screen.getByTestId('emoji-viewport')).toBeTruthy();
    });

    it('renders loading state', () => {
        render(<EmojiPicker onSelect={vi.fn()} onClose={vi.fn()} />);
        expect(screen.getByText('Loading...')).toBeTruthy();
    });

    it('renders empty state', () => {
        render(<EmojiPicker onSelect={vi.fn()} onClose={vi.fn()} />);
        expect(screen.getByText('No emoji found.')).toBeTruthy();
    });

    it('renders emoji list', () => {
        render(<EmojiPicker onSelect={vi.fn()} onClose={vi.fn()} />);
        expect(screen.getByTestId('emoji-list')).toBeTruthy();
    });

    it('renders emoji button with emoji character', () => {
        render(<EmojiPicker onSelect={vi.fn()} onClose={vi.fn()} />);
        const buttons = screen.getAllByRole('button');
        const emojiBtn = buttons.find(b => b.textContent.includes('😀'));
        expect(emojiBtn).toBeTruthy();
    });

    it('calls onSelect and onClose when emoji is clicked', () => {
        const onSelect = vi.fn();
        const onClose = vi.fn();
        render(<EmojiPicker onSelect={onSelect} onClose={onClose} />);
        const buttons = screen.getAllByRole('button');
        const emojiBtn = buttons.find(b => b.textContent.includes('😀'));
        fireEvent.click(emojiBtn);
        expect(onSelect).toHaveBeenCalledWith('😀');
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('renders category header', () => {
        render(<EmojiPicker onSelect={vi.fn()} onClose={vi.fn()} />);
        expect(screen.getByText('Smileys')).toBeTruthy();
    });

    it('renders active emoji display when emoji is active', () => {
        render(<EmojiPicker onSelect={vi.fn()} onClose={vi.fn()} />);
        expect(screen.getByText('grinning face')).toBeTruthy();
    });

    it('works with no callbacks provided', () => {
        render(<EmojiPicker />);
        const buttons = screen.getAllByRole('button');
        const emojiBtn = buttons.find(b => b.textContent.includes('😀'));
        expect(() => fireEvent.click(emojiBtn)).not.toThrow();
    });

    it('renders EmptyFooter when ActiveEmoji has no emoji', () => {
        mockActiveEmoji.mockReturnValue({ emoji: null });
        render(<EmojiPicker onSelect={vi.fn()} onClose={vi.fn()} />);
        expect(screen.getByText('Select an emoji...')).toBeTruthy();
    });

    it('calls onSelect with optional chaining when onClose is undefined', () => {
        const onSelect = vi.fn();
        render(<EmojiPicker onSelect={onSelect} />);
        const buttons = screen.getAllByRole('button');
        const emojiBtn = buttons.find(b => b.textContent.includes('😀'));
        fireEvent.click(emojiBtn);
        expect(onSelect).toHaveBeenCalledWith('😀');
    });
});
