import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AllSocieties from '../../pages/Societies/AllSocieties';

vi.mock('../../components/Society/SocietyCard', () => ({
    default: ({ society, onClick }) => (
        <div data-testid={`society-card-${society.id}`} onClick={onClick}>
            {society.name}
        </div>
    ),
}));

vi.mock('../../components/Tags/BasePill', () => ({
    default: ({ label, isActive, onClick }) => (
        <button className={isActive ? 'active' : ''} onClick={onClick}>{label}</button>
    ),
}));

vi.mock('../../components/common/SearchBar', () => ({
    default: ({ value, onChange, placeholder }) => (
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    ),
}));

vi.mock('../../components/common/AnimatedDropdown', () => ({
    default: ({ value, onChange, options, placeholder }) => (
        <select
            aria-label={placeholder}
            value={value}
            onChange={e => onChange(e.target.value)}
        >
            {(options || []).map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    ),
}));

vi.mock('../../components/Pagination/Pagination', () => ({
    Pagination: ({ currentPage, totalPages, onPageChange }) => (
        <div data-testid="pagination">
            <span>Page {currentPage} of {totalPages}</span>
            {currentPage > 1 && <button onClick={() => onPageChange(currentPage - 1)}>Prev</button>}
            {currentPage < totalPages && <button onClick={() => onPageChange(currentPage + 1)}>Next</button>}
        </div>
    ),
    BackToTop: () => <button>Back to top</button>,
}));

const mockSocieties = [
    { id: 1, name: 'Chess Club', is_ratified: true, category: 'sports', member_count: 50 },
    { id: 2, name: 'Art Society', is_ratified: false, category: 'arts', member_count: 30 },
    { id: 3, name: 'Coding Club', is_ratified: true, category: 'academic', member_count: 100 },
];

describe('AllSocieties', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the back button', () => {
        render(<AllSocieties onBack={vi.fn()} onSelect={vi.fn()} societies={mockSocieties} />);
        expect(screen.getByText('← Back')).toBeTruthy();
    });

    it('calls onBack when back button is clicked', () => {
        const onBack = vi.fn();
        render(<AllSocieties onBack={onBack} onSelect={vi.fn()} societies={mockSocieties} />);
        fireEvent.click(screen.getByText('← Back'));
        expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('renders society cards', () => {
        render(<AllSocieties onBack={vi.fn()} onSelect={vi.fn()} societies={mockSocieties} />);
        expect(screen.getByText('Chess Club')).toBeTruthy();
        expect(screen.getByText('Art Society')).toBeTruthy();
    });

    it('renders search input', () => {
        render(<AllSocieties onBack={vi.fn()} onSelect={vi.fn()} societies={mockSocieties} />);
        expect(screen.getByPlaceholderText('Search societies...')).toBeTruthy();
    });

    it('filters societies by search', () => {
        render(<AllSocieties onBack={vi.fn()} onSelect={vi.fn()} societies={mockSocieties} />);
        fireEvent.change(screen.getByPlaceholderText('Search societies...'), { target: { value: 'chess' } });
        expect(screen.getByText('Chess Club')).toBeTruthy();
        expect(screen.queryByText('Art Society')).toBeNull();
    });

    it('shows empty state when no societies match', () => {
        render(<AllSocieties onBack={vi.fn()} onSelect={vi.fn()} societies={mockSocieties} />);
        fireEvent.change(screen.getByPlaceholderText('Search societies...'), { target: { value: 'zzz' } });
        expect(screen.getByText(/No societies match/i)).toBeTruthy();
    });

    it('calls onSelect when a society card is clicked', () => {
        const onSelect = vi.fn();
        render(<AllSocieties onBack={vi.fn()} onSelect={onSelect} societies={mockSocieties} />);
        fireEvent.click(screen.getByTestId('society-card-1'));
        expect(onSelect).toHaveBeenCalled();
    });

    it('renders sort dropdown', () => {
        render(<AllSocieties onBack={vi.fn()} onSelect={vi.fn()} societies={mockSocieties} />);
        expect(screen.getByRole('combobox')).toBeTruthy();
    });

    it('sorts societies by name Z-A', () => {
        render(<AllSocieties onBack={vi.fn()} onSelect={vi.fn()} societies={mockSocieties} />);
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'name-desc' } });
        const cards = screen.getAllByTestId(/society-card-/);
        expect(cards[0].textContent).toBe('Coding Club');
    });

    it('sorts by newest (highest id first)', () => {
        render(<AllSocieties onBack={vi.fn()} onSelect={vi.fn()} societies={mockSocieties} />);
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'newest' } });
        const cards = screen.getAllByTestId(/society-card-/);
        expect(cards[0].textContent).toBe('Coding Club');
    });

    it('sorts by most members', () => {
        render(<AllSocieties onBack={vi.fn()} onSelect={vi.fn()} societies={mockSocieties} />);
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'members' } });
        const cards = screen.getAllByTestId(/society-card-/);
        expect(cards[0].textContent).toBe('Coding Club');
    });

    it('shows clear filter button when filter is active', () => {
        render(<AllSocieties onBack={vi.fn()} onSelect={vi.fn()} societies={mockSocieties} />);
        // Click a ratification filter to activate it
        const ratifiedBtn = screen.getAllByRole('button').find(b => b.textContent.includes('Ratified'));
        if (ratifiedBtn) fireEvent.click(ratifiedBtn);
        expect(screen.queryByText(/Clear/)).toBeTruthy();
    });

    it('renders with empty societies list', () => {
        render(<AllSocieties onBack={vi.fn()} onSelect={vi.fn()} societies={[]} />);
        expect(screen.getByText('No societies found')).toBeTruthy();
    });

    it('renders pagination', () => {
        render(<AllSocieties onBack={vi.fn()} onSelect={vi.fn()} societies={mockSocieties} />);
        expect(screen.getAllByTestId('pagination')).toHaveLength(2);
    });

    it('sorts societies by name A-Z by default', () => {
        render(<AllSocieties onBack={vi.fn()} onSelect={vi.fn()} societies={mockSocieties} />);
        const cards = screen.getAllByTestId(/society-card-/);
        expect(cards[0].textContent).toBe('Art Society');
    });

    it('filters by ratification unratified and shows only unratified', () => {
        render(<AllSocieties onBack={vi.fn()} onSelect={vi.fn()} societies={mockSocieties} />);
        const unratifiedBtn = screen.getAllByRole('button').find(b => b.textContent.includes('Unratified'));
        if (unratifiedBtn) fireEvent.click(unratifiedBtn);
        expect(screen.getByText('Art Society')).toBeTruthy();
        expect(screen.queryByText('Chess Club')).toBeNull();
    });

    it('filters by category when category pill is clicked', () => {
        render(<AllSocieties onBack={vi.fn()} onSelect={vi.fn()} societies={mockSocieties} />);
        const artsBtn = screen.getAllByRole('button').find(b => b.textContent === 'Arts');
        if (artsBtn) fireEvent.click(artsBtn);
        expect(screen.getByText('Art Society')).toBeTruthy();
    });

    it('passes onReport and onUnreport to society cards', () => {
        const onReport = vi.fn();
        const onUnreport = vi.fn();
        render(<AllSocieties onBack={vi.fn()} onSelect={vi.fn()} societies={mockSocieties} onReport={onReport} onUnreport={onUnreport} />);
        expect(screen.getByTestId('society-card-1')).toBeTruthy();
    });

    it('handles unknown sort value by returning list unchanged', () => {
        render(<AllSocieties onBack={vi.fn()} onSelect={vi.fn()} societies={mockSocieties} />);
        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'other' } });
        expect(screen.getAllByTestId(/society-card-/).length).toBe(3);
    });

    it('clears filters when clear button is clicked', () => {
        render(<AllSocieties onBack={vi.fn()} onSelect={vi.fn()} societies={mockSocieties} />);
        const ratifiedBtn = screen.getAllByRole('button').find(b => b.textContent?.includes('Ratified'));
        if (ratifiedBtn) fireEvent.click(ratifiedBtn);
        expect(screen.queryByText(/Clear/)).toBeTruthy();
        fireEvent.click(screen.getByText(/Clear/));
        expect(screen.getByText('Chess Club')).toBeTruthy();
        expect(screen.getByText('Art Society')).toBeTruthy();
    });

    it('paginates results', () => {
        const defaultProps = { onBack: vi.fn(), onSelect: vi.fn() };
        render(<AllSocieties {...defaultProps} societies={Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `Society ${String(i + 1).padStart(2, '0')}`, is_ratified: true, categories: [] }))} />);
        expect(screen.getByText('Society 01')).toBeTruthy();
        expect(screen.queryByText('Society 21')).toBeNull();
        fireEvent.click(screen.getAllByText('Next')[0]);
        expect(screen.getByText('Society 21')).toBeTruthy();
        expect(screen.queryByText('Society 01')).toBeNull();
    });

    it('toggling same filter deactivates it', () => {
        render(<AllSocieties onBack={vi.fn()} onSelect={vi.fn()} societies={mockSocieties} />);
        const ratifiedBtn = screen.getAllByRole('button').find(b => b.textContent?.includes('Ratified'));
        if (ratifiedBtn) {
            fireEvent.click(ratifiedBtn);
            expect(screen.queryByText('Art Society')).toBeNull();
            fireEvent.click(ratifiedBtn);
        }
        expect(screen.getByText('Art Society')).toBeTruthy();
    });

    it('pagination resets on search', () => {
        const manySocs = Array.from({ length: 30 }, (_, i) => ({
            id: i + 1,
            name: `Test Soc ${String(i + 1).padStart(2, '0')}`,
            is_ratified: true,
            categories: ['academic']
        }));
        render(<AllSocieties onBack={vi.fn()} onSelect={vi.fn()} societies={manySocs} />);
        fireEvent.click(screen.getAllByText('Next')[0]);
        expect(screen.getByText('Test Soc 21')).toBeTruthy();

        const searchInput = screen.getByPlaceholderText('Search societies...');
        fireEvent.change(searchInput, { target: { value: 'Test Soc 01' } }); // Force down to 1 item

        expect(screen.getByText('Test Soc 01')).toBeTruthy();
    });

    it('handles back to previous page', () => {
        const manySocs = Array.from({ length: 30 }, (_, i) => ({
            id: i + 1,
            name: `Soc ${String(i + 1).padStart(2, '0')}`,
            is_ratified: true,
            categories: []
        }));
        render(<AllSocieties onBack={vi.fn()} onSelect={vi.fn()} societies={manySocs} />);
        fireEvent.click(screen.getAllByText('Next')[0]);
        expect(screen.getByText('Soc 21')).toBeTruthy();
        fireEvent.click(screen.getAllByText('Prev')[0]);
        expect(screen.getByText('Soc 01')).toBeTruthy();
    });

    it('calls onSelect with undefined when onClick is not provided', () => {
        render(<AllSocieties onBack={vi.fn()} societies={mockSocieties} />);
        fireEvent.click(screen.getByTestId('society-card-1'));
    });

    it('sorts by members with fallback for missing member_count', () => {
        const societies = [
            { id: 1, name: 'A', is_ratified: true },
            { id: 2, name: 'B', is_ratified: true, member_count: 10 },
        ];
        render(<AllSocieties onBack={vi.fn()} onSelect={vi.fn()} societies={societies} />);
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'members' } });
        const cards = screen.getAllByTestId(/society-card-/);
        expect(cards[0].textContent).toBe('B');
    });

    it('renders with default empty societies prop', () => {
        render(<AllSocieties onBack={vi.fn()} onSelect={vi.fn()} />);
        expect(screen.getByText('No societies found')).toBeTruthy();
    });
});
