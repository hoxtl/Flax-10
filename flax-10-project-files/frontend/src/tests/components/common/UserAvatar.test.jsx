import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UserAvatar from '../../../components/common/user_avatar/UserAvatar';

vi.mock('../../../components/common/user_avatar/UserAvatar.module.css', () => ({
    default: { userInfo: 'userInfo', userNameDetails: 'userNameDetails', userFullName: 'userFullName', userHandle: 'userHandle', avatar: 'avatar' },
}));

describe('UserAvatar', () => {
    it('returns null when user is null or undefined', () => {
        const { container } = render(<UserAvatar user={null} />);
        expect(container.firstChild).toBeNull();
        const { container: c2 } = render(<UserAvatar />);
        expect(c2.firstChild).toBeNull();
    });

    it('renders avatar only when avatarOnly is true', () => {
        const user = { username: 'plainjane', first_name: 'Mary', last_name: 'Lane' };
        render(<UserAvatar user={user} avatarOnly={true} />);
        expect(screen.getByText('M')).toBeInTheDocument();
        expect(screen.queryByText('Mary Lane')).not.toBeInTheDocument();
        expect(screen.queryByText('@plainjane')).not.toBeInTheDocument();
    });

    it('renders full block with name and handle when avatarOnly is false', () => {
        const user = { username: 'plainjane', first_name: 'Mary', last_name: 'Lane' };
        render(<UserAvatar user={user} />);
        expect(screen.getByText('Mary Lane')).toBeInTheDocument();
        expect(screen.getByText('@plainjane')).toBeInTheDocument();
        expect(screen.getByText('M')).toBeInTheDocument();
    });

    it('uses profile_photo_url when present', () => {
        const user = { username: 'u', profile_photo_url: 'https://example.com/photo.jpg' };
        const { container } = render(<UserAvatar user={user} avatarOnly={true} />);
        const img = container.querySelector('img');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
    });

    it('uses profile_photo when profile_photo_url is absent', () => {
        const user = { username: 'u', profile_photo: 'https://example.com/avatar.png' };
        const { container } = render(<UserAvatar user={user} avatarOnly={true} />);
        const img = container.querySelector('img');
        expect(img).toHaveAttribute('src', 'https://example.com/avatar.png');
    });

    it('uses avatar when only avatar is set', () => {
        const user = { username: 'u', avatar: 'https://example.com/av.gif' };
        const { container } = render(<UserAvatar user={user} avatarOnly={true} />);
        const img = container.querySelector('img');
        expect(img).toHaveAttribute('src', 'https://example.com/av.gif');
    });

    it('uses seeded tutor photo when no uploaded photo exists', () => {
        const user = { username: 'srahwan' };
        const { container } = render(<UserAvatar user={user} avatarOnly={true} />);
        const img = container.querySelector('img');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src');
        expect(img.getAttribute('src')).toContain('images.unsplash.com');
    });

    it('shows initial from first_name', () => {
        const user = { username: 'alice', first_name: 'Alice', last_name: 'X' };
        render(<UserAvatar user={user} avatarOnly={true} />);
        expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('shows initial from username when first_name is missing', () => {
        const user = { username: 'bob' };
        render(<UserAvatar user={user} avatarOnly={true} />);
        expect(screen.getByText('b')).toBeInTheDocument();
    });

    it('shows ? when no first_name and no username', () => {
        const user = {};
        render(<UserAvatar user={user} avatarOnly={true} />);
        expect(screen.getByText('?')).toBeInTheDocument();
    });

    it('getFullName uses first_name and last_name when present', () => {
        const user = { username: 'x', first_name: 'John', last_name: 'Smith' };
        render(<UserAvatar user={user} />);
        expect(screen.getByText('John Smith')).toBeInTheDocument();
    });

    it('getFullName uses username when no first or last name', () => {
        const user = { username: 'nohandle' };
        render(<UserAvatar user={user} />);
        expect(screen.getByText('nohandle')).toBeInTheDocument();
    });

    it('getFullName trims single name', () => {
        const user = { username: 'x', first_name: 'Solo' };
        render(<UserAvatar user={user} />);
        expect(screen.getByText('Solo')).toBeInTheDocument();
    });

    it('applies size style when size prop is passed in avatarOnly mode', () => {
        const user = { username: 'u', first_name: 'A' };
        const { container } = render(<UserAvatar user={user} avatarOnly={true} size="50" />);
        const div = container.querySelector('.avatar');
        expect(div).toBeInTheDocument();
        expect(div).toHaveStyle({ fontSize: '20px' });
    });

    it('calls onClick when wrapper is clicked and not avatarOnly', () => {
        const user = { username: 'jdoe', first_name: 'John', last_name: 'Doe' };
        const onClick = vi.fn();
        render(<UserAvatar user={user} onClick={onClick} />);
        fireEvent.click(screen.getByText('John Doe'));
        expect(onClick).toHaveBeenCalled();
    });
});
