import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('lucide-react', () => ({
    ArrowUp: () => <svg data-testid="arrow-up" />,
}));

import { Pagination, BackToTop } from '../../components/pagination/Pagination';

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
        const buttons = screen.getAllByRole('button');
        expect(buttons[0]).toBeDisabled();
    });

    it('Next button is disabled on last page', () => {
        render(<Pagination currentPage={5} totalPages={5} onPageChange={vi.fn()} />);
        const buttons = screen.getAllByRole('button');
        expect(buttons[buttons.length - 1]).toBeDisabled();
    });

    it('calls onPageChange with next page when Next clicked', () => {
        const onPageChange = vi.fn();
        render(<Pagination currentPage={2} totalPages={5} onPageChange={onPageChange} />);
        const buttons = screen.getAllByRole('button');
        fireEvent.click(buttons[buttons.length - 1]);
        expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('calls onPageChange with prev page when Previous clicked', () => {
        const onPageChange = vi.fn();
        render(<Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />);
        const [prevButton] = screen.getAllByRole('button');
        fireEvent.click(prevButton);
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

    it('getPageNumbers returns start ellipsis when currentPage <= 3', () => {
        render(<Pagination currentPage={2} totalPages={10} onPageChange={vi.fn()} />);
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('4')).toBeInTheDocument();
        expect(screen.getAllByText('...').length).toBeGreaterThanOrEqual(1);
    });

    it('getPageNumbers returns end ellipsis when currentPage >= total - 2', () => {
        render(<Pagination currentPage={9} totalPages={10} onPageChange={vi.fn()} />);
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('7')).toBeInTheDocument();
    });

    it('getPageNumbers returns both ellipses for middle page', () => {
        render(<Pagination currentPage={5} totalPages={10} onPageChange={vi.fn()} />);
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('4')).toBeInTheDocument();
        expect(screen.getByText('6')).toBeInTheDocument();
        expect(screen.getAllByText('...').length).toBe(2);
    });

    it('hides nav button text when measured width is below the threshold', () => {
        const original = HTMLElement.prototype.getBoundingClientRect;
        HTMLElement.prototype.getBoundingClientRect = vi.fn(function getBoundingClientRect() {
            const text = this.textContent || '';
            const width = text.includes('Previous') ? 40 : text.includes('Next') ? 30 : 120;
            return { width, height: 20, top: 0, left: 0, right: width, bottom: 20, x: 0, y: 0 };
        });

        try {
            render(<Pagination currentPage={2} totalPages={5} onPageChange={vi.fn()} />);
            expect(screen.getByRole('button', { name: '←' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: '→' })).toBeInTheDocument();
        } finally {
            HTMLElement.prototype.getBoundingClientRect = original;
        }
    });

    it('keeps full nav labels when ResizeObserver is unavailable', () => {
        const originalResizeObserver = global.ResizeObserver;
        const original = HTMLElement.prototype.getBoundingClientRect;
        delete global.ResizeObserver;
        HTMLElement.prototype.getBoundingClientRect = vi.fn(() => ({
            width: 120, height: 20, top: 0, left: 0, right: 120, bottom: 20, x: 0, y: 0,
        }));

        try {
            render(<Pagination currentPage={2} totalPages={5} onPageChange={vi.fn()} />);
            expect(screen.getByRole('button', { name: '← Previous' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Next →' })).toBeInTheDocument();
        } finally {
            global.ResizeObserver = originalResizeObserver;
            HTMLElement.prototype.getBoundingClientRect = original;
        }
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

    it('calls scrollTo on container when button clicked', () => {
        const scrollToMock = vi.fn();
        const container = document.createElement('div');
        container.className = 'content';
        container.scrollTo = scrollToMock;
        document.body.appendChild(container);
        vi.spyOn(document, 'querySelector').mockReturnValue(container);
        render(<BackToTop alwaysVisible={true} containerSelector=".content" />);
        fireEvent.click(screen.getByTestId('arrow-up').closest('button'));
        expect(scrollToMock).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
        document.body.removeChild(container);
        vi.restoreAllMocks();
    });
});
