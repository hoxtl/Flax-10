import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Discover from '../../pages/Discover/Discover';

vi.mock('../../api/userService', () => ({
    searchUsers: vi.fn().mockResolvedValue({ results: [], total_count: 0 }),
}));

vi.mock('../../components/Social/UserSearch', () => ({
    FilterSection: () => <div data-testid="filter-section" />,
    useSearchInit: vi.fn(() => ({ allCourses: {}, allSocieties: [] })),
    useFilterState: vi.fn(() => ({
        isFilterOpen: false,
        setIsFilterOpen: vi.fn(),
        props: { selectedCourses: [], selectedYears: [], selectedSocieties: [] },
    })),
    useClickOutside: vi.fn(),
}));

vi.mock('../../components/Pagination/Pagination', () => ({
    Pagination: ({ currentPage, totalPages }) => (
        <div data-testid="pagination">{currentPage}/{totalPages}</div>
    ),
    BackToTop: () => <button data-testid="back-to-top">Top</button>,
}));

import { searchUsers } from '../../api/userService';

describe('Discover', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('renders page title', () => {
        render(<Discover onNavChange={vi.fn()} />);
        expect(screen.getByText('Discover', { selector: 'h1' })).toBeTruthy();
    });

    it('renders subtitle', () => {
        const { container } = render(<Discover onNavChange={vi.fn()} />);
        const subtitle = container.querySelector('p[class*="subtitle"]');
        expect(subtitle?.textContent).toContain("Find King's students, course mates, and professors across your subjects.");
    });

    it('renders search input', () => {
        render(<Discover onNavChange={vi.fn()} />);
        expect(screen.getByPlaceholderText(/Search by name/)).toBeTruthy();
    });

    it('shows loading state initially', () => {
        const { container } = render(<Discover onNavChange={vi.fn()} />);
        expect(container.querySelector('[class*="skelWrap"]')).toBeTruthy();
    });

    it('shows empty state when no users found', async () => {
        searchUsers.mockResolvedValue({ results: [], total_count: 0 });
        render(<Discover onNavChange={vi.fn()} />);
        await waitFor(() => expect(screen.getByText(/No users found/)).toBeTruthy());
    });

    it('renders user cards when users returned', async () => {
        searchUsers.mockResolvedValue({
            results: [{ id: 2, username: 'bob', first_name: 'Bob', last_name: 'Jones' }],
            total_count: 1,
        });
        render(<Discover onNavChange={vi.fn()} />);
        await waitFor(() => expect(screen.getByText('@bob')).toBeTruthy());
    });

    it('shows professor pill and Dr prefix for teacher cards', async () => {
        searchUsers.mockResolvedValue({
            results: [{ id: 7, username: 'teach', first_name: 'Sam', last_name: 'Rahwan', role: 'teacher' }],
            total_count: 1,
        });
        render(<Discover onNavChange={vi.fn()} />);
        await waitFor(() => expect(screen.getByText('@teach')).toBeTruthy());
        expect(screen.getByText('Dr. Sam Rahwan')).toBeTruthy();
        expect(screen.getByText('Professor')).toBeTruthy();
    });

    it('calls onNavChange with profile id when user card is clicked', async () => {
        searchUsers.mockResolvedValue({
            results: [{ id: 2, username: 'bob', first_name: 'Bob', last_name: 'Jones' }],
            total_count: 1,
        });
        const onNavChange = vi.fn();
        render(<Discover onNavChange={onNavChange} />);
        await waitFor(() => screen.getByText('@bob'));
        fireEvent.click(screen.getByText('Bob Jones'));
        expect(onNavChange).toHaveBeenCalledWith('profile_2');
    });

    it('filters out the logged-in user', async () => {
        localStorage.setItem('user', JSON.stringify({ id: 2, username: 'bob' }));
        searchUsers.mockResolvedValue({
            results: [
                { id: 2, username: 'bob', first_name: 'Bob', last_name: 'Jones' },
                { id: 3, username: 'alice', first_name: 'Alice', last_name: 'Smith' },
            ],
            total_count: 2,
        });
        render(<Discover onNavChange={vi.fn()} />);
        await waitFor(() => screen.getByText('@alice'));
        expect(screen.queryByText('@bob')).toBeNull();
    });

    it('updates search when user types', async () => {
        render(<Discover onNavChange={vi.fn()} />);
        const input = screen.getByPlaceholderText(/Search by name/);
        fireEvent.change(input, { target: { value: 'alice' } });
        expect(input.value).toBe('alice');
    });
});
