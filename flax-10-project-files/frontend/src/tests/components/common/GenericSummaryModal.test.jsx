import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import GenericSummaryModal from '../../../components/common/GenericSummaryModal/GenericSummaryModal';
import SummaryItem from '../../../components/common/GenericSummaryModal/SummaryItem';

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
vi.mock('../../../components/common/EmptyState/EmptyState', () => ({
    default: ({ title, description }) => (
        <div data-testid="empty-state">
            <strong>{title}</strong>
            <p>{description}</p>
        </div>
    ),
}));

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

    it('renders custom emptyContent when provided', () => {
        render(
            <GenericSummaryModal
                isOpen={true}
                onClose={vi.fn()}
                title="Title"
                items={[]}
                renderItem={() => null}
                emptyContent={<div data-testid="custom-empty">Custom empty</div>}
            />
        );
        expect(screen.getByTestId('custom-empty')).toBeInTheDocument();
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

    it('renders the loading skeleton when loading', () => {
        render(
            <GenericSummaryModal
                isOpen={true}
                onClose={vi.fn()}
                title="Title"
                subtitle="Details"
                items={[{ id: 1, name: 'Alice' }]}
                renderItem={() => null}
                loading={true}
            />
        );
        expect(screen.getByTestId('standard-modal')).toBeInTheDocument();
        expect(screen.getByText('Details')).toBeInTheDocument();
        expect(document.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    });

    it('applies custom container and list classes when rendering items', () => {
        render(
            <GenericSummaryModal
                isOpen={true}
                onClose={vi.fn()}
                title="Title"
                items={[{ id: 1, name: 'Alice' }]}
                renderItem={(item) => <span key={item.id}>{item.name}</span>}
                containerClassName="container-extra"
                listClassName="list-extra"
            />
        );
        expect(document.querySelector('.container-extra')).toBeInTheDocument();
        expect(document.querySelector('.list-extra')).toBeInTheDocument();
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

describe('SummaryItem', () => {
    it('renders a clickable row and triggers onClick from Enter', () => {
        const onClick = vi.fn();
        render(
            <SummaryItem
                avatar={<span>😀</span>}
                title="Alice"
                subtitle="Student"
                onClick={onClick}
            />
        );

        const item = screen.getByRole('button', { name: /Alice/i });
        fireEvent.keyDown(item, { key: 'Enter' });
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('stops rightAction clicks from bubbling to the row handler', () => {
        const onClick = vi.fn();
        const rightActionClick = vi.fn();
        render(
            <SummaryItem
                title="Task"
                onClick={onClick}
                rightAction={<button onClick={rightActionClick}>More</button>}
            />
        );

        fireEvent.click(screen.getByText('More'));
        expect(rightActionClick).toHaveBeenCalledTimes(1);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('renders a static row when no click handler is provided', () => {
        render(<SummaryItem title="Static" subtitle="Row" />);
        expect(screen.queryByRole('button', { name: /Static/i })).toBeNull();
        expect(screen.getByText('Static')).toBeInTheDocument();
    });
});
