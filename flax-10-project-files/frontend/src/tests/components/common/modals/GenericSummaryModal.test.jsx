import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import GenericSummaryModal from '../../../../components/common/generic_summary_modal/GenericSummaryModal';

vi.mock('../../../../components/common/standard_modal/StandardModal', () => ({
    default: ({ title, subtitle, onClose, children }) => (
        <div data-testid="standard-modal">
            <h2>{title}</h2>
            <p>{subtitle}</p>
            <button onClick={onClose}>Close</button>
            {children}
        </div>
    ),
}));
vi.mock('../../../../components/common/generic_summary_modal/GenericSummaryModal.module.css', () => ({
    default: {
        container: 'container',
        list: 'list',
        topContent: 'topContent',
        loadingItem: 'loadingItem',
        loadingAvatar: 'loadingAvatar',
        loadingInfo: 'loadingInfo',
        loadingLine: 'loadingLine',
        loadingLineShort: 'loadingLineShort',
    },
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

    it('renders loading rows when loading is true', () => {
        const { container } = render(
            <GenericSummaryModal isOpen={true} onClose={vi.fn()} title="Title" items={[]} loading />
        );
        expect(container.querySelectorAll('.loadingItem')).toHaveLength(5);
    });

    it('prefers emptyContent over the default empty state', () => {
        render(
            <GenericSummaryModal
                isOpen={true}
                onClose={vi.fn()}
                title="Title"
                items={[]}
                emptyContent={<div data-testid="custom-empty">Custom empty</div>}
            />
        );
        expect(screen.getByTestId('custom-empty')).toBeInTheDocument();
        expect(screen.queryByText('No items found.')).toBeNull();
    });

    it('applies custom container and list classes', () => {
        const { container } = render(
            <GenericSummaryModal
                isOpen={true}
                onClose={vi.fn()}
                title="Title"
                items={[{ id: 1, name: 'Alice' }]}
                renderItem={(item) => <span key={item.id}>{item.name}</span>}
                containerClassName="outer-shell"
                listClassName="inner-list"
            />
        );
        expect(container.querySelector('.container.outer-shell')).toBeTruthy();
        expect(container.querySelector('.list.inner-list')).toBeTruthy();
    });
});
