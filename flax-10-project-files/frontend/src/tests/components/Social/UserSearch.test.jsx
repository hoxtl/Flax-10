import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, renderHook, act, waitFor } from '@testing-library/react';

vi.mock('framer-motion', () => ({
    motion: new Proxy({}, {
        get: (_, tag) => ({ children, ...props }) => {
            const Tag = typeof tag === 'string' ? tag : 'div';
            const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props;
            return <Tag {...rest}>{children}</Tag>;
        },
    }),
    AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('../../../api/userService', () => ({
    searchUsers: vi.fn(() => Promise.resolve([])),
}));

vi.mock('../../../api/societyApi', () => ({
    fetchSocieties: vi.fn(() => Promise.resolve([])),
}));

vi.mock('../../../lib/kclCourses', () => ({
    KCL_DEPARTMENTS: {
        'Natural, Mathematical & Engineering Sciences': ['Computer Science', 'Artificial Intelligence'],
        'Arts & Humanities': ['History'],
    },
}));

vi.mock('../../../components/common/SearchBar/SearchBar', () => ({
    default: ({ value, onChange, placeholder, onFocus }) => (
        <input
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            onFocus={onFocus}
            data-testid="search-bar"
        />
    ),
}));

import UserSearch, {
    UserResultItem,
    CourseResultItem,
    SocietyResultItem,
    useClickOutside,
    useSearchInit,
    FilterSection,
} from '../../../components/Social/UserSearch';

import { searchUsers } from '../../../api/userService';
import { fetchSocieties } from '../../../api/societyApi';

describe('UserResultItem', () => {
    it('renders user initials and name', () => {
        const user = { id: 1, first_name: 'Alice', last_name: 'Smith', username: 'asmith' };
        render(<UserResultItem user={user} onSelect={vi.fn()} />);
        expect(screen.getByText('A')).toBeTruthy(); // initial
        expect(screen.getByText('Alice Smith')).toBeTruthy();
        expect(screen.getByText('@asmith')).toBeTruthy();
    });

    it('uses username initial when no first_name', () => {
        const user = { id: 2, username: 'bob' };
        render(<UserResultItem user={user} onSelect={vi.fn()} />);
        expect(screen.getByText('b')).toBeTruthy();
    });

    it('renders empty first/last name with space', () => {
        const user = { id: 3, first_name: '', last_name: '', username: 'empty' };
        render(<UserResultItem user={user} onSelect={vi.fn()} />);
        expect(screen.getByText('@empty')).toBeTruthy();
    });

    it('calls onSelect when clicked', () => {
        const onSelect = vi.fn();
        const user = { id: 1, first_name: 'Alice', username: 'alice' };
        render(<UserResultItem user={user} onSelect={onSelect} />);
        fireEvent.click(screen.getByText('Alice'));
        expect(onSelect).toHaveBeenCalledOnce();
    });
});

describe('CourseResultItem', () => {
    it('renders course name', () => {
        render(<CourseResultItem course="Computer Science" isChecked={false} onToggle={vi.fn()} />);
        expect(screen.getByText('Computer Science')).toBeTruthy();
    });

    it('shows checked checkbox when isChecked is true', () => {
        render(<CourseResultItem course="Computer Science" isChecked={true} onToggle={vi.fn()} />);
        const checkbox = screen.getByRole('checkbox');
        expect(checkbox.checked).toBe(true);
    });

    it('calls onToggle when clicked', () => {
        const onToggle = vi.fn();
        render(<CourseResultItem course="Computer Science" isChecked={false} onToggle={onToggle} />);
        fireEvent.click(screen.getByText('Computer Science'));
        expect(onToggle).toHaveBeenCalledWith('Computer Science');
    });

    it('calls onToggle once when clicking checkbox (stopPropagation)', () => {
        const onToggle = vi.fn();
        render(<CourseResultItem course="Algorithms" isChecked={false} onToggle={onToggle} />);
        fireEvent.click(screen.getByRole('checkbox'));
        expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('renders course using index as key', () => {
        render(<CourseResultItem course="Unknown" isChecked={false} onToggle={vi.fn()} />);
        expect(screen.getByText('Unknown')).toBeTruthy();
    });
});

describe('SocietyResultItem', () => {
    it('renders society name', () => {
        const society = { id: 1, name: 'Chess Club', categories: ['sports'] };
        render(<SocietyResultItem society={society} isChecked={false} onToggle={vi.fn()} />);
        expect(screen.getByText('Chess Club')).toBeTruthy();
    });

    it('renders without categories', () => {
        const society = { id: 2, name: 'Coding Society', categories: [] };
        render(<SocietyResultItem society={society} isChecked={false} onToggle={vi.fn()} />);
        expect(screen.getByText('Coding Society')).toBeTruthy();
    });

    it('renders without categories when categories is undefined', () => {
        const society = { id: 3, name: 'No Cat Society' };
        render(<SocietyResultItem society={society} isChecked={false} onToggle={vi.fn()} />);
        expect(screen.getByText('No Cat Society')).toBeTruthy();
    });

    it('calls onToggle with society id when clicked', () => {
        const onToggle = vi.fn();
        const society = { id: 5, name: 'Drama Club' };
        render(<SocietyResultItem society={society} isChecked={false} onToggle={onToggle} />);
        fireEvent.click(screen.getByText('Drama Club'));
        expect(onToggle).toHaveBeenCalledWith(5);
    });
});

describe('UserSearch', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders search bar', () => {
        render(<UserSearch onUserSelect={vi.fn()} />);
        expect(screen.getByTestId('search-bar')).toBeTruthy();
    });

    it('renders without onUserSelect prop', () => {
        render(<UserSearch />);
        expect(screen.getByTestId('search-bar')).toBeTruthy();
    });

    it('handles user select when onUserSelect is undefined', async () => {
        searchUsers.mockResolvedValueOnce([{ id: 1, first_name: 'A', last_name: 'B', username: 'ab' }]);
        render(<UserSearch />);
        fireEvent.focus(screen.getByTestId('search-bar'));
        fireEvent.change(screen.getByTestId('search-bar'), { target: { value: 'a' } });
        await waitFor(() => expect(screen.getByText('A B')).toBeTruthy());
        fireEvent.click(screen.getByText('A B'));
    });

    it('renders Filter button', () => {
        render(<UserSearch onUserSelect={vi.fn()} />);
        expect(screen.getByText('Filter')).toBeTruthy();
    });

    it('opens filter dropdown when Filter clicked', () => {
        render(<UserSearch onUserSelect={vi.fn()} />);
        fireEvent.click(screen.getByText('Filter'));
        expect(screen.getByText('Courses')).toBeTruthy();
        expect(screen.getByText('Year')).toBeTruthy();
        expect(screen.getByText('Societies')).toBeTruthy();
    });

    it('closes filter when Filter clicked again', () => {
        render(<UserSearch onUserSelect={vi.fn()} />);
        fireEvent.click(screen.getByText('Filter'));
        fireEvent.click(screen.getByText('Filter'));
        expect(screen.queryByText('Courses')).toBeNull();
    });

    it('shows "Start typing..." when focused with empty query', async () => {
        vi.useFakeTimers();
        render(<UserSearch onUserSelect={vi.fn()} />);
        fireEvent.focus(screen.getByTestId('search-bar'));
        await act(async () => {
            vi.advanceTimersByTime(350);
            await vi.runOnlyPendingTimersAsync();
        });
        expect(screen.getByText('Start typing')).toBeTruthy();
        expect(searchUsers).not.toHaveBeenCalled();
    });

    it('debounces user search and renders selectable results', async () => {
        searchUsers.mockResolvedValueOnce({ results: [{ id: 1, first_name: 'Alice', last_name: 'Smith', username: 'asmith' }] });
        const onUserSelect = vi.fn();
        render(<UserSearch onUserSelect={onUserSelect} />);

        const input = screen.getByTestId('search-bar');
        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: 'ali' } });

        await waitFor(() => {
            expect(searchUsers).toHaveBeenCalledWith('ali', '', '', 0, 20, '');
        });
        await screen.findByText('@asmith');

        fireEvent.click(screen.getByText('Alice Smith'));
        expect(onUserSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
        expect(screen.getByTestId('search-bar').value).toBe('');
    });

    it('can search with course filter (no query) once focused', async () => {
        fetchSocieties.mockResolvedValueOnce([]);
        searchUsers.mockResolvedValueOnce([]);
        render(<UserSearch onUserSelect={vi.fn()} />);

        fireEvent.click(screen.getByText('Filter'));
        await waitFor(() => expect(screen.getByText('Computer Science')).toBeTruthy());
        fireEvent.click(screen.getByText('Computer Science'));

        const userSearchInput = screen.getAllByTestId('search-bar').find((el) => el.getAttribute('placeholder') === 'Search users...');
        fireEvent.focus(userSearchInput);
        await new Promise((r) => setTimeout(r, 350));
        await waitFor(() => expect(searchUsers).toHaveBeenCalledWith('', 'Computer Science', '', 0, 20, ''));
    });

    it('can search with year filter', async () => {
        searchUsers.mockResolvedValueOnce([]);
        render(<UserSearch onUserSelect={vi.fn()} />);

        fireEvent.click(screen.getByText('Filter'));
        fireEvent.click(screen.getByText('Year'));
        fireEvent.click(screen.getByText('Year 2'));

        const userSearchInput = screen.getAllByTestId('search-bar').find((el) => el.getAttribute('placeholder') === 'Search users...');
        fireEvent.focus(userSearchInput);
        await new Promise((r) => setTimeout(r, 350));
        await waitFor(() => expect(searchUsers).toHaveBeenCalledWith('', '', '', 0, 20, 'Year 2'));
    });

    it('toggles course and society filters on and off', async () => {
        fetchSocieties.mockResolvedValueOnce([{ id: 1, name: 'Chess', categories: ['sports'] }]);
        render(<UserSearch onUserSelect={vi.fn()} />);
        fireEvent.click(screen.getByText('Filter'));
        await waitFor(() => expect(screen.getByText('Computer Science')).toBeTruthy());
        fireEvent.click(screen.getByText('Computer Science'));
        expect(screen.getAllByRole('checkbox')[0]).toBeChecked();
        fireEvent.click(screen.getByText('Computer Science'));
        expect(screen.getAllByRole('checkbox')[0]).not.toBeChecked();
        fireEvent.click(screen.getByText('Societies'));
        await waitFor(() => expect(screen.getByText('Chess')).toBeTruthy());
        fireEvent.click(screen.getByText('Chess'));
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes[checkboxes.length - 1]).toBeChecked();
    });

    it('handles society init errors without crashing', async () => {
        const errSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        fetchSocieties.mockRejectedValueOnce(new Error('societies down'));
        render(<UserSearch onUserSelect={vi.fn()} />);

        await act(async () => { });
        expect(screen.getByTestId('search-bar')).toBeTruthy();
        expect(errSpy).toHaveBeenCalled();
        errSpy.mockRestore();
    });

    it('shows societies tab and filters societies', async () => {
        fetchSocieties.mockResolvedValueOnce([
            { id: 1, name: 'Chess Club', categories: ['sports'] },
            { id: 2, name: 'Drama Society', categories: ['arts'] },
        ]);
        render(<UserSearch onUserSelect={vi.fn()} />);
        fireEvent.click(screen.getByText('Filter'));
        await waitFor(() => expect(screen.getByText('Societies')).toBeTruthy());
        fireEvent.click(screen.getByText('Societies'));
        await waitFor(() => {
            expect(screen.getByText('Chess Club')).toBeTruthy();
            expect(screen.getByText('Drama Society')).toBeTruthy();
        });
    });

    it('shows "No users found" when search returns empty', async () => {
        searchUsers.mockResolvedValueOnce([]);
        render(<UserSearch onUserSelect={vi.fn()} />);
        fireEvent.focus(screen.getByTestId('search-bar'));
        fireEvent.change(screen.getByTestId('search-bar'), { target: { value: 'nonexistent' } });
        await waitFor(() => expect(searchUsers).toHaveBeenCalled());
        await waitFor(() => expect(screen.getByText('No users found')).toBeTruthy());
    });

    it('handles searchUsers rejection', async () => {
        searchUsers.mockRejectedValueOnce(new Error('search failed'));
        render(<UserSearch onUserSelect={vi.fn()} />);
        fireEvent.focus(screen.getByTestId('search-bar'));
        fireEvent.change(screen.getByTestId('search-bar'), { target: { value: 'test' } });
        await waitFor(() => expect(searchUsers).toHaveBeenCalled());
        await waitFor(() => expect(screen.queryByText('Searching...')).toBeNull());
    });

    it('handles searchUsers returning array directly', async () => {
        searchUsers.mockResolvedValueOnce([{ id: 1, first_name: 'Ali', last_name: 'B', username: 'ali' }]);
        render(<UserSearch onUserSelect={vi.fn()} />);
        fireEvent.focus(screen.getByTestId('search-bar'));
        fireEvent.change(screen.getByTestId('search-bar'), { target: { value: 'ali' } });
        await waitFor(() => expect(screen.getByText('Ali B')).toBeTruthy());
    });

    it('shows expand button when more than 5 societies', async () => {
        const socs = Array.from({ length: 7 }, (_, i) => ({
            id: i + 1,
            name: `Society ${i + 1}`,
            categories: ['sports'],
        }));
        fetchSocieties.mockResolvedValueOnce(socs);
        render(<UserSearch onUserSelect={vi.fn()} />);
        fireEvent.click(screen.getByText('Filter'));
        fireEvent.click(screen.getByText('Societies'));
        await waitFor(() => expect(screen.getByText(/\+ 2 more/)).toBeTruthy());
    });

    it('groups societies with no categories under other', async () => {
        fetchSocieties.mockResolvedValueOnce([
            { id: 1, name: 'No Cat Society' },
            { id: 2, name: 'Another No Cat', categories: [] },
        ]);
        render(<UserSearch onUserSelect={vi.fn()} />);
        fireEvent.click(screen.getByText('Filter'));
        fireEvent.click(screen.getByText('Societies'));
        await waitFor(() => {
            expect(screen.getByText('No Cat Society')).toBeTruthy();
            expect(screen.getByText('Another No Cat')).toBeTruthy();
        });
    });

    it('closes search dropdown when clicking outside', async () => {
        render(<UserSearch onUserSelect={vi.fn()} />);
        fireEvent.focus(screen.getByTestId('search-bar'));
        expect(screen.getByPlaceholderText('Search users...')).toBeTruthy();
        fireEvent.mouseDown(document.body);
        await waitFor(() => expect(screen.queryByText('Start typing...')).toBeNull());
    });

    it('closes filter dropdown when clicking outside', () => {
        render(<UserSearch onUserSelect={vi.fn()} />);
        fireEvent.click(screen.getByText('Filter'));
        expect(screen.getByText('Courses')).toBeTruthy();
        fireEvent.mouseDown(document.body);
        expect(screen.queryByText('Courses')).toBeNull();
    });

    it('filter search filters courses by query', async () => {
        fetchSocieties.mockResolvedValueOnce([]);
        render(<UserSearch onUserSelect={vi.fn()} />);
        fireEvent.click(screen.getByText('Filter'));
        await waitFor(() => expect(screen.getByText('Computer Science')).toBeTruthy());
        const filterInput = screen.getByPlaceholderText('Search courses or departments...');
        fireEvent.change(filterInput, { target: { value: 'art' } });
        await waitFor(() => {
            expect(screen.getByText('Artificial Intelligence')).toBeTruthy();
            expect(screen.queryByText('Computer Science')).toBeNull();
        });
    });

    it('filter search filters societies by query', async () => {
        fetchSocieties.mockResolvedValueOnce([
            { id: 1, name: 'Chess Club', categories: ['sports'] },
            { id: 2, name: 'Drama Society', categories: ['arts'] },
        ]);
        render(<UserSearch onUserSelect={vi.fn()} />);
        fireEvent.click(screen.getByText('Filter'));
        fireEvent.click(screen.getByText('Societies'));
        await waitFor(() => expect(screen.getByText('Chess Club')).toBeTruthy());
        const filterInput = screen.getByPlaceholderText('Search societies...');
        fireEvent.change(filterInput, { target: { value: 'drama' } });
        await waitFor(() => {
            expect(screen.getByText('Drama Society')).toBeTruthy();
            expect(screen.queryByText('Chess Club')).toBeNull();
        });
    });

    it('shows No societies found when societies empty', async () => {
        fetchSocieties.mockResolvedValueOnce([]);
        render(<UserSearch onUserSelect={vi.fn()} />);
        fireEvent.click(screen.getByText('Filter'));
        fireEvent.click(screen.getByText('Societies'));
        await waitFor(() => expect(screen.getByText('No societies found')).toBeTruthy());
    });

    it('shows Searching users while loading', async () => {
        searchUsers.mockImplementation(() => new Promise(() => { }));
        render(<UserSearch onUserSelect={vi.fn()} />);
        fireEvent.focus(screen.getByTestId('search-bar'));
        fireEvent.change(screen.getByTestId('search-bar'), { target: { value: 'test' } });
        await waitFor(() => expect(screen.getByText('Searching users')).toBeTruthy());
    });

    it('does not call searchUsers when query and filters are all empty', async () => {
        vi.useFakeTimers();
        fetchSocieties.mockResolvedValueOnce([]);
        render(<UserSearch onUserSelect={vi.fn()} />);
        fireEvent.focus(screen.getByTestId('search-bar'));
        await act(async () => {
            vi.advanceTimersByTime(400);
            await vi.runOnlyPendingTimersAsync();
        });
        expect(searchUsers).not.toHaveBeenCalled();
        vi.useRealTimers();
    });
});

describe('useClickOutside', () => {
    it('calls onOutside when clicking outside ref element', () => {
        const ref = { current: document.createElement('div') };
        document.body.appendChild(ref.current);
        const onOutside = vi.fn();
        renderHook(() => useClickOutside(ref, onOutside));
        fireEvent.mouseDown(document.body);
        expect(onOutside).toHaveBeenCalled();
        document.body.removeChild(ref.current);
    });

    it('does not call onOutside when clicking inside ref element', () => {
        const div = document.createElement('div');
        document.body.appendChild(div);
        const ref = { current: div };
        const onOutside = vi.fn();
        renderHook(() => useClickOutside(ref, onOutside));
        fireEvent.mouseDown(div);
        expect(onOutside).not.toHaveBeenCalled();
        document.body.removeChild(div);
    });

    it('does not call onOutside when ref.current is null', () => {
        const ref = { current: null };
        const onOutside = vi.fn();
        renderHook(() => useClickOutside(ref, onOutside));
        fireEvent.mouseDown(document.body);
        expect(onOutside).not.toHaveBeenCalled();
    });
});
