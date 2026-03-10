import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SocietySection from '../../../pages/Societies/SocietySection';

vi.mock('../../../components/Society/SocietyCard', () => ({
    default: ({ society, onClick }) => (
        <div data-testid="society-card" onClick={onClick}>{society.name}</div>
    ),
}));

vi.mock('../../../components/Society/BrowseCard', () => ({
    default: ({ onClick }) => (
        <button data-testid="browse-card" onClick={onClick}>Browse</button>
    ),
}));

const societies = [
    { id: 1, name: 'Chess Club' },
    { id: 2, name: 'Drama Society' },
];

describe('SocietySection', () => {
    it('renders the section title', () => {
        render(<SocietySection title="My Societies" items={societies} type="member" onAction={vi.fn()} />);
        expect(screen.getByText('My Societies')).toBeTruthy();
    });

    it('renders society cards for each item', () => {
        render(<SocietySection title="Test" items={societies} type="member" onAction={vi.fn()} />);
        expect(screen.getAllByTestId('society-card')).toHaveLength(2);
        expect(screen.getByText('Chess Club')).toBeTruthy();
        expect(screen.getByText('Drama Society')).toBeTruthy();
    });

    it('renders BrowseCard for member type', () => {
        render(<SocietySection title="Test" items={societies} type="member" onAction={vi.fn()} />);
        expect(screen.getByTestId('browse-card')).toBeTruthy();
    });

    it('does not render BrowseCard for non-member type', () => {
        render(<SocietySection title="Test" items={societies} type="admin" onAction={vi.fn()} />);
        expect(screen.queryByTestId('browse-card')).toBeNull();
    });

    it('renders + button for admin type', () => {
        const onAction = vi.fn();
        render(<SocietySection title="Test" items={societies} type="admin" onAction={onAction} />);
        expect(screen.getByText('+')).toBeTruthy();
    });

    it('calls onAction when + button is clicked', () => {
        const onAction = vi.fn();
        render(<SocietySection title="Test" items={societies} type="admin" onAction={onAction} />);
        fireEvent.click(screen.getByText('+'));
        expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('does not render + button for non-admin type', () => {
        render(<SocietySection title="Test" items={societies} type="member" onAction={vi.fn()} />);
        expect(screen.queryByText('+')).toBeNull();
    });

    it('shows empty admin state when items is empty and type is admin', () => {
        render(<SocietySection title="Test" items={[]} type="admin" onAction={vi.fn()} />);
        expect(screen.getByText(/Create a society/i)).toBeTruthy();
    });

    it('calls onAction when Create a society is clicked', () => {
        const onAction = vi.fn();
        render(<SocietySection title="Test" items={[]} type="admin" onAction={onAction} />);
        fireEvent.click(screen.getByText(/Create a society/i));
        expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('shows member empty state with BrowseCard when items is empty and type is member', () => {
        render(<SocietySection title="Test" items={[]} type="member" onAction={vi.fn()} />);
        expect(screen.getByTestId('browse-card')).toBeTruthy();
        expect(screen.queryByText("You don't manage any societies yet.")).toBeNull();
    });

    it('calls onSelect when a society card is clicked', () => {
        const onSelect = vi.fn();
        render(<SocietySection title="Test" items={societies} type="member" onAction={vi.fn()} onSelect={onSelect} />);
        fireEvent.click(screen.getAllByTestId('society-card')[0]);
        expect(onSelect).toHaveBeenCalledWith(societies[0]);
    });

    it('does not render section header when hideTitle is true', () => {
        render(<SocietySection hideTitle title="Hidden Title" items={societies} type="member" onAction={vi.fn()} />);
        expect(screen.queryByText('Hidden Title')).not.toBeInTheDocument();
    });

    it('renders pagination when pagination prop is provided and totalPages > 1', () => {
        render(
            <SocietySection
                title="Test"
                items={societies}
                type="member"
                onAction={vi.fn()}
                pagination={{ currentPage: 1, totalPages: 2, onPageChange: vi.fn() }}
            />
        );
        expect(screen.getByRole('button', { name: /Next/ })).toBeInTheDocument();
    });
});
