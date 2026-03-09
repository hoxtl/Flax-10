import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('lucide-react', () => ({
    ArrowUp: () => <svg data-testid="arrow-up" />,
}));

import { Pagination, BackToTop } from '../../components/Pagination/Pagination';

describe('Pagination', () => {
    it('returns null when totalPages <= 1', () => {
        const { container } = render(<Pagination currentPage={1} totalPages={1} onPageChange={vi.fn()} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders page buttons', () => {
        render(<Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />);
        expect(screen.getByText('1')).toBeTruthy();
        expect(screen.getByText('5')).toBeTruthy();
    });

    it('Previous button is disabled on first page', () => {
        render(<Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />);
        expect(screen.getByText('← Previous').disabled).toBe(true);
    });

    it('Next button is disabled on last page', () => {
        render(<Pagination currentPage={5} totalPages={5} onPageChange={vi.fn()} />);
        expect(screen.getByText('Next →').disabled).toBe(true);
    });

    it('calls onPageChange with next page when Next clicked', () => {
        const onPageChange = vi.fn();
        render(<Pagination currentPage={2} totalPages={5} onPageChange={onPageChange} />);
        fireEvent.click(screen.getByText('Next →'));
        expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('calls onPageChange with prev page when Previous clicked', () => {
        const onPageChange = vi.fn();
        render(<Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />);
        fireEvent.click(screen.getByText('← Previous'));
        expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('calls onPageChange when a page number is clicked', () => {
        const onPageChange = vi.fn();
        render(<Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />);
        fireEvent.click(screen.getByText('3'));
        expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('shows ellipsis for many pages', () => {
        render(<Pagination currentPage={5} totalPages={10} onPageChange={vi.fn()} />);
        const ellipses = screen.getAllByText('...');
        expect(ellipses.length).toBeGreaterThan(0);
    });
});

describe('BackToTop', () => {
    it('renders when alwaysVisible is true', () => {
        render(<BackToTop alwaysVisible={true} />);
        expect(screen.getByTestId('arrow-up')).toBeTruthy();
    });

    it('is hidden by default (not alwaysVisible)', () => {
        const { container } = render(<BackToTop alwaysVisible={false} />);
        expect(container.firstChild).toBeNull();
    });
});
