import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UserListModal from '../../../components/social/components/UserListModal';

vi.mock('../../../components/social/components/ShareButton', () => ({
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
    expect(screen.getByText('No users found')).toBeInTheDocument();
    expect(screen.getByText('No one is sharing with you yet.')).toBeInTheDocument();
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

  it('renders a View calendar action when requested and calls onUserCalendarClick', () => {
    const onUserCalendarClick = vi.fn();
    render(
      <UserListModal
        title="People"
        users={users}
        onClose={vi.fn()}
        showCalendarAction
        onUserCalendarClick={onUserCalendarClick}
      />
    );

    fireEvent.click(screen.getAllByText(/view calendar/i)[0]);

    expect(screen.queryByTestId('share-2')).not.toBeInTheDocument();
    expect(onUserCalendarClick).toHaveBeenCalledWith(expect.objectContaining({ id: 3, username: 'cara' }));
  });

  it('closes on overlay and close button clicks, but not modal content click', () => {
    const onClose = vi.fn();
    const { container } = render(<UserListModal title="People" users={users} onClose={onClose} />);

    const backdrop = document.body.querySelector('div[class*="_backdrop"]') || document.body.querySelector('[class*="backdrop"]');
    expect(backdrop).toBeTruthy();
    fireEvent.mouseDown(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);

    const closeBtn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(2);

    const modalContent = document.body.querySelector('div[class*="_modal"]') || container.querySelector('[class*="modal"]');
    if (modalContent) fireEvent.click(modalContent);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('renders the user row when first_name is empty', () => {
    render(<UserListModal title="People" users={users} onClose={vi.fn()} />);
    expect(screen.getByText('Clark')).toBeInTheDocument();
  });

  it('treats matching username as current user even when id differs', () => {
    localStorage.setItem('user', JSON.stringify({ id: 999, username: 'alice' }));
    render(<UserListModal title="People" users={users} onClose={vi.fn()} />);

    const handles = screen.getAllByText(/@/).map((el) => el.textContent);
    expect(handles[0]).toBe('@alice');
    expect(screen.queryByTestId('share-1')).not.toBeInTheDocument();
  });

  it('uses username when first_name and last_name are both empty', () => {
    const usersOnlyUsername = [
      { id: 10, username: 'anon', first_name: '', last_name: '', is_sharing: false },
    ];
    render(<UserListModal title="People" users={usersOnlyUsername} onClose={vi.fn()} />);
    expect(screen.getByText('anon')).toBeInTheDocument();
  });

  it('formats name from first_name only', () => {
    const usersFirstOnly = [
      { id: 20, username: 'jane', first_name: 'Jane', last_name: '', is_sharing: false },
    ];
    render(<UserListModal title="People" users={usersFirstOnly} onClose={vi.fn()} />);
    expect(screen.getByText('Jane')).toBeInTheDocument();
  });

  it('sorts sharing users before non-sharing when neither is current user', () => {
    localStorage.setItem('user', JSON.stringify({ id: 99, username: 'other' }));
    const list = [
      { id: 1, username: 'a', first_name: 'A', last_name: 'A', is_sharing: false },
      { id: 2, username: 'b', first_name: 'B', last_name: 'B', is_sharing: true },
    ];
    render(<UserListModal title="People" users={list} onClose={vi.fn()} />);
    const handles = screen.getAllByText(/@/).map((el) => el.textContent);
    expect(handles).toEqual(['@b', '@a']);
  });

  it('handles missing onUserClick without crashing', () => {
    render(<UserListModal title="People" users={users} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('@bob'));
  });

  it('handles empty localStorage user and sorts by is_sharing', () => {
    localStorage.removeItem('user');
    render(<UserListModal title="People" users={users} onClose={vi.fn()} />);
    const handles = screen.getAllByText(/@/).map((el) => el.textContent);
    expect(handles).toEqual(['@alice', '@cara', '@bob']);
  });

  it('renders user without id using username as key', () => {
    const usersNoId = [
      { username: 'noid', first_name: 'No', last_name: 'Id', is_sharing: false },
    ];
    render(<UserListModal title="People" users={usersNoId} onClose={vi.fn()} />);
    expect(screen.getByText('No Id')).toBeInTheDocument();
  });

  it('renders a profile photo when a shared user has one resolved', () => {
    const photoUsers = [
      { id: 99, username: 'ricky.curtis', first_name: 'Ricky', last_name: 'Curtis', is_sharing: true, profile_photo_url: 'https://example.com/avatar.jpg' },
    ];
    render(<UserListModal title="People" users={photoUsers} onClose={vi.fn()} />);
    expect(document.body.querySelector('img[src=\"https://example.com/avatar.jpg\"]')).toBeTruthy();
  });
});
