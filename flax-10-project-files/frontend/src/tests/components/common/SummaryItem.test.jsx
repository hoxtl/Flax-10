import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SummaryItem from '../../../components/Common/GenericSummaryModal/SummaryItem';

vi.mock('../../../components/Common/GenericSummaryModal/GenericSummaryModal.module.css', () => ({ default: {} }));

describe('SummaryItem', () => {
    it('renders title and optional subtitle', () => {
        render(<SummaryItem title="Title" />);
        expect(screen.getByText('Title')).toBeInTheDocument();
        render(<SummaryItem title="A" subtitle="B" />);
        expect(screen.getByText('B')).toBeInTheDocument();
    });

    it('calls onClick when Enter key is pressed and onClick is provided', () => {
        const onClick = vi.fn();
        render(<SummaryItem title="Click me" onClick={onClick} />);
        const item = screen.getByRole('button', { name: /click me/i });
        fireEvent.keyDown(item, { key: 'Enter' });
        expect(onClick).toHaveBeenCalled();
    });

    it('does not call onClick on other keys', () => {
        const onClick = vi.fn();
        render(<SummaryItem title="Item" onClick={onClick} />);
        fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
        expect(onClick).not.toHaveBeenCalled();
    });

    it('renders rightAction and stopPropagation on rightAction click', () => {
        const onClick = vi.fn();
        const rightClick = vi.fn();
        render(
            <SummaryItem
                title="Row"
                onClick={onClick}
                rightAction={<button onClick={rightClick}>Action</button>}
            />
        );
        fireEvent.click(screen.getByText('Action'));
        expect(rightClick).toHaveBeenCalled();
        expect(onClick).not.toHaveBeenCalled();
    });

    it('renders avatar when provided', () => {
        render(<SummaryItem title="T" avatar={<span>Avatar</span>} />);
        expect(screen.getByText('Avatar')).toBeInTheDocument();
    });
});
