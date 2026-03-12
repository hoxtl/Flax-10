import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import GenericSummaryModal from '../../../components/common/GenericSummaryModal/GenericSummaryModal';

vi.mock('../../../components/common/StandardModal/StandardModal', () => ({
    default: ({ title, subtitle, onClose, children }) => (
        <div data-testid="standard-modal">
            <h2>{title}</h2>
            <p>{subtitle}</p>
            <button onClick={onClose}>Close</button>
            {children}
        </div>
    ),
}));
vi.mock('../../../components/common/GenericSummaryModal/GenericSummaryModal.module.css', () => ({ default: {} }));

describe('GenericSummaryModal', () => {
    it('returns null when isOpen is false', () => {
        const { container } = render(
            <GenericSummaryModal isOpen={false} onClose={vi.fn()} title="Title" items={[]} renderItem={() => null} />
        );
        expect(container.firstChild).toBeNull();
    });

    it('shows default empty message when items are empty and no emptyMessage', () => {
        render(
            <GenericSummaryModal isOpen={true} onClose={vi.fn()} title="Title" items={[]} renderItem={() => null} />
        );
        expect(screen.getByText('No items found.')).toBeInTheDocument();
    });

    it('shows custom emptyMessage when items are empty', () => {
        render(
            <GenericSummaryModal
                isOpen={true}
                onClose={vi.fn()}
                title="Title"
                items={[]}
                renderItem={() => null}
                emptyMessage="Nothing here."
            />
        );
        expect(screen.getByText('Nothing here.')).toBeInTheDocument();
    });

    it('renders list with renderItem when items provided', () => {
        const renderItem = vi.fn((item) => <span key={item.id}>{item.name}</span>);
        render(
            <GenericSummaryModal
                isOpen={true}
                onClose={vi.fn()}
                title="Title"
                items={[{ id: 1, name: 'Alice' }]}
                renderItem={renderItem}
            />
        );
        expect(renderItem).toHaveBeenCalledWith({ id: 1, name: 'Alice' }, 0);
        expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('renders topContent when provided', () => {
        render(
            <GenericSummaryModal
                isOpen={true}
                onClose={vi.fn()}
                title="Title"
                items={[]}
                renderItem={() => null}
                topContent={<div data-testid="top">Top</div>}
            />
        );
        expect(screen.getByTestId('top')).toBeInTheDocument();
        expect(screen.getByText('Top')).toBeInTheDocument();
    });

    it('shows empty when items is null', () => {
        render(
            <GenericSummaryModal isOpen={true} onClose={vi.fn()} title="Title" items={null} renderItem={() => null} />
        );
        expect(screen.getByText('No items found.')).toBeInTheDocument();
    });

    it('renders children when provided', () => {
        render(
            <GenericSummaryModal isOpen={true} onClose={vi.fn()} title="Title" items={[{ id: 1 }]}>
                <div data-testid="children">Child Content</div>
            </GenericSummaryModal>
        );
        expect(screen.getByTestId('children')).toBeInTheDocument();
        expect(screen.getByText('Child Content')).toBeInTheDocument();
    });
});
