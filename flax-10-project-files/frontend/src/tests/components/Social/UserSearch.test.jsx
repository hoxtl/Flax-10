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

vi.mock('../../../api/moduleApi', () => ({
    getModules: vi.fn(() => Promise.resolve([])),
}));

vi.mock('../../../api/societyApi', () => ({
    fetchSocieties: vi.fn(() => Promise.resolve([])),
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
    ModuleResultItem,
    SocietyResultItem,
    useClickOutside,
    useSearchInit,
    FilterSection,
} from '../../../components/Social/UserSearch';

import { searchUsers } from '../../../api/userService';
import { getModules } from '../../../api/moduleApi';
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

    it('calls onSelect when clicked', () => {
        const onSelect = vi.fn();
        const user = { id: 1, first_name: 'Alice', username: 'alice' };
        render(<UserResultItem user={user} onSelect={onSelect} />);
        fireEvent.click(screen.getByText('Alice'));
        expect(onSelect).toHaveBeenCalledOnce();
    });
});

describe('ModuleResultItem', () => {
    it('renders module code and name', () => {
        const mod = { id: 1, module_code: 'CS3001', module_name: 'Algorithms' };
        render(<ModuleResultItem module={mod} isChecked={false} onToggle={vi.fn()} />);
        expect(screen.getByText('CS3001')).toBeTruthy();
        expect(screen.getByText('Algorithms')).toBeTruthy();
    });

    it('shows checked checkbox when isChecked is true', () => {
        const mod = { id: 1, module_code: 'CS3001', module_name: 'Algorithms' };
        render(<ModuleResultItem module={mod} isChecked={true} onToggle={vi.fn()} />);
        const checkbox = screen.getByRole('checkbox');
        expect(checkbox.checked).toBe(true);
    });

    it('calls onToggle when clicked', () => {
        const onToggle = vi.fn();
        const mod = { id: 1, module_code: 'CS3001', module_name: 'Algorithms' };
        render(<ModuleResultItem module={mod} isChecked={false} onToggle={onToggle} />);
        fireEvent.click(screen.getByText('CS3001'));
        expect(onToggle).toHaveBeenCalled();
    });
});

describe('SocietyResultItem', () => {
    it('renders society name', () => {
        const society = { id: 1, name: 'Chess Club', categories: ['sports'] };
        render(<SocietyResultItem society={society} isChecked={false} onToggle={vi.fn()} />);
        expect(screen.getByText('Chess Club')).toBeTruthy();
        expect(screen.getByText('sports society')).toBeTruthy();
    });

    it('renders without categories', () => {
        const society = { id: 2, name: 'Coding Society', categories: [] };
        render(<SocietyResultItem society={society} isChecked={false} onToggle={vi.fn()} />);
        expect(screen.getByText('Coding Society')).toBeTruthy();
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

    it('renders Filter button', () => {
        render(<UserSearch onUserSelect={vi.fn()} />);
        expect(screen.getByText('Filter')).toBeTruthy();
    });

    it('opens filter dropdown when Filter clicked', () => {
        render(<UserSearch onUserSelect={vi.fn()} />);
        fireEvent.click(screen.getByText('Filter'));
        // Filter dropdown shows the module/societies tabs
        expect(screen.getByText('modules')).toBeTruthy();
        expect(screen.getByText('societies')).toBeTruthy();
    });

    it('closes filter when Filter clicked again', () => {
        render(<UserSearch onUserSelect={vi.fn()} />);
        fireEvent.click(screen.getByText('Filter'));
        fireEvent.click(screen.getByText('Filter'));
        expect(screen.queryByText('modules')).toBeNull();
    });

    it('shows "Start typing..." when focused with empty query', async () => {
        vi.useFakeTimers();
        render(<UserSearch onUserSelect={vi.fn()} />);
        fireEvent.focus(screen.getByTestId('search-bar'));
        await act(async () => {
            vi.advanceTimersByTime(350);
            await vi.runOnlyPendingTimersAsync();
        });
        expect(screen.getByText('Start typing...')).toBeTruthy();
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
            expect(searchUsers).toHaveBeenCalledWith('ali', '', '');
        });
        await screen.findByText('@asmith');

        fireEvent.click(screen.getByText('Alice Smith'));
        expect(onUserSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
        expect(screen.getByTestId('search-bar').value).toBe('');
    });

    it('can search with module filter (no query) once focused', async () => {
        getModules.mockResolvedValueOnce([
            { id: 1, module_code: 'CS3001', module_name: 'Algorithms' },
            { id: 2, module_code: 'MA102', module_name: 'Math' },
        ]);
        fetchSocieties.mockResolvedValueOnce([]);
        searchUsers.mockResolvedValueOnce([]);
        render(<UserSearch onUserSelect={vi.fn()} />);

        // open filter and toggle a module
        fireEvent.click(screen.getByText('Filter'));
        await waitFor(() => expect(screen.getByText('CS3001')).toBeTruthy());
        fireEvent.click(screen.getByText('CS3001'));

        // focusing search activates dropdown + search effect even with empty query
        const userSearchInput = screen.getAllByTestId('search-bar').find((el) => el.getAttribute('placeholder') === 'Search users...');
        fireEvent.focus(userSearchInput);
        await new Promise((r) => setTimeout(r, 350));
        await waitFor(() => expect(searchUsers).toHaveBeenCalledWith('', 'CS3001', ''));
    });

    it('handles module/society init errors without crashing', async () => {
        const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        getModules.mockRejectedValueOnce(new Error('modules down'));
        fetchSocieties.mockRejectedValueOnce(new Error('societies down'));
        render(<UserSearch onUserSelect={vi.fn()} />);

        // Flush the init promises
        await act(async () => {});
        expect(screen.getByTestId('search-bar')).toBeTruthy();
        expect(errSpy).toHaveBeenCalled();
        errSpy.mockRestore();
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
});
