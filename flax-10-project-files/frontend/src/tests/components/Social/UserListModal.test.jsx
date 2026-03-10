import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UserListModal from '../../../components/Social/UserListModal';

vi.mock('../../../components/Social/ShareButton', () => ({
  default: ({ userId, onToggle }) => (
    <button data-testid={`share-${userId}`} onClick={() => onToggle?.(userId, true)}>
      Share
    </button>
  ),
}));

const users = [
  { id: 2, username: 'bob', first_name: 'Bob', last_name: 'Baker', is_sharing: false },
  { id: 1, username: 'alice', first_name: 'Alice', last_name: 'Avery', is_sharing: true },
  { id: 3, username: 'cara', first_name: '', last_name: 'Clark', is_sharing: true },
];

describe('UserListModal', () => {
  beforeEach(() => {
    localStorage.setItem('user', JSON.stringify({ id: 1, username: 'alice' }));
  });

  it('returns null when users is missing', () => {
    const { container } = render(<UserListModal title="People" users={null} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders empty state when users array is empty', () => {
    render(<UserListModal title="People" users={[]} onClose={vi.fn()} />);
    expect(screen.getByText('No users found.')).toBeInTheDocument();
  });

  it('sorts current user first, then sharing users', () => {
    render(<UserListModal title="People" users={users} onClose={vi.fn()} />);

    const handles = screen.getAllByText(/@/).map((el) => el.textContent);
    expect(handles).toEqual(['@alice', '@cara', '@bob']);
  });

  it('does not render ShareButton for current user and does for others', () => {
    render(<UserListModal title="People" users={users} onClose={vi.fn()} />);

    expect(screen.queryByTestId('share-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('share-2')).toBeInTheDocument();
    expect(screen.getByTestId('share-3')).toBeInTheDocument();
  });

  it('calls onUserClick when a user row is clicked', () => {
    const onUserClick = vi.fn();
    render(<UserListModal title="People" users={users} onClose={vi.fn()} onUserClick={onUserClick} />);

    fireEvent.click(screen.getByText('@bob'));

    expect(onUserClick).toHaveBeenCalledWith(expect.objectContaining({ id: 2, username: 'bob' }));
  });

  it('calls onUserUpdate via ShareButton toggle', () => {
    const onUserUpdate = vi.fn();
    render(<UserListModal title="People" users={users} onClose={vi.fn()} onUserUpdate={onUserUpdate} />);

    fireEvent.click(screen.getByTestId('share-2'));

    expect(onUserUpdate).toHaveBeenCalledWith(2, true);
  });

  it('closes on overlay and close button clicks, but not modal content click', () => {
    const onClose = vi.fn();
    const { container } = render(<UserListModal title="People" users={users} onClose={onClose} />);

    fireEvent.click(container.querySelector('[class*="modalOverlay"]'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: '×' }));
    expect(onClose).toHaveBeenCalledTimes(2);

    fireEvent.click(container.querySelector('[class*="modalContent"]'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('renders avatar fallback from username when first_name is empty', () => {
    render(<UserListModal title="People" users={users} onClose={vi.fn()} />);
    expect(screen.getByText('c')).toBeInTheDocument();
  });

  it('treats matching username as current user even when id differs', () => {
    localStorage.setItem('user', JSON.stringify({ id: 999, username: 'alice' }));
    render(<UserListModal title="People" users={users} onClose={vi.fn()} />);

    const handles = screen.getAllByText(/@/).map((el) => el.textContent);
    expect(handles[0]).toBe('@alice');
    expect(screen.queryByTestId('share-1')).not.toBeInTheDocument();
  });
});
