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

vi.mock('../../components/ui/AnimatedDropdown', () => ({
    default: ({ value, onChange, options, placeholder = 'Select' }) => (
        <select aria-label={placeholder} value={value} onChange={(e) => onChange(e.target.value)}>
            {options.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
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
        expect(screen.getByText('No societies found')).toBeTruthy();
    });

    it('calls onSelect when a society card is clicked', () => {
        const onSelect = vi.fn();
        render(<AllSocieties onBack={vi.fn()} onSelect={onSelect} societies={mockSocieties} />);
        fireEvent.click(screen.getByTestId('society-card-1'));
        expect(onSelect).toHaveBeenCalledWith(mockSocieties[0]);
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
});
