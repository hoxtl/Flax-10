import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, renderHook } from '@testing-library/react';

vi.mock('framer-motion', () => ({
    motion: new Proxy({}, {
        get: (_, tag) => ({ children, initial, animate, exit, transition, whileHover, whileTap, ...rest }) => {
            const Tag = typeof tag === 'string' ? tag : 'div';
            return <Tag {...rest}>{children}</Tag>;
        },
    }),
    AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('../../../../api/userApi', () => ({ searchUsers: vi.fn(() => Promise.resolve([])) }));
vi.mock('../../../../api/societyApi', () => ({ fetchSocieties: vi.fn(() => Promise.resolve([])) }));
vi.mock('../../../../lib/kclCourses', () => ({
    KCL_DEPARTMENTS: {
        'Natural, Mathematical & Engineering Sciences': ['Computer Science', 'Artificial Intelligence'],
        'Arts & Humanities': ['History'],
    },
}));
vi.mock('../../../../components/common/search_bar/SearchBar', () => ({
    default: ({ value, onChange, placeholder, onFocus }) => (
        <input value={value} onChange={e => onChange(e.target.value)}
            placeholder={placeholder} onFocus={onFocus} data-testid="search-bar" />
    ),
}));

import { UserResultItem, CourseResultItem, SocietyResultItem, useClickOutside } from '../../../../components/social/components/UserSearch';

describe('UserResultItem', () => {
    it('renders user name and handle', () => {
        const user = { id: 1, first_name: 'Alice', last_name: 'Smith', username: 'asmith' };
        render(<UserResultItem user={user} onSelect={vi.fn()} />);
        expect(screen.getByText('Alice Smith')).toBeTruthy();
        expect(screen.getByText('@asmith')).toBeTruthy();
    });

    it('uses username text when no first_name', () => {
        const user = { id: 2, username: 'bob' };
        render(<UserResultItem user={user} onSelect={vi.fn()} />);
        expect(screen.getByText('@bob')).toBeTruthy();
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
        expect(screen.getByRole('checkbox').checked).toBe(true);
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
