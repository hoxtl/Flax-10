import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-router-dom', () => ({
    Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

vi.mock('framer-motion', () => ({
    motion: new Proxy({}, {
        get: (_, tag) => ({ children, ...props }) => {
            const Tag = typeof tag === 'string' ? tag : 'div';
            const { initial, animate, exit, transition, variants, whileHover, ...rest } = props;
            return <Tag {...rest}>{children}</Tag>;
        },
    }),
    AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('lucide-react', () => ({
    Users: () => <svg />,
    ChevronRight: () => <svg />,
    Lightbulb: () => <svg />,
}));

vi.mock('../../../components/Society/hooks/useSocieties', () => ({
    useSocieties: vi.fn(() => ({ societies: [], loading: false })),
}));

import { SocialDiscoverWidget } from '../../../pages/Homepage/components/SocialDiscoverWidget';
import { useSocieties } from '../../../components/Society/hooks/useSocieties';

describe('SocialDiscoverWidget', () => {
    it('renders Discover header', () => {
        render(<SocialDiscoverWidget />);
        expect(screen.getByText('Discover')).toBeTruthy();
    });

    it('shows mock coursemates when no coursemates provided', () => {
        render(<SocialDiscoverWidget />);
        expect(screen.getByText(/4 coursemates/)).toBeTruthy();
    });

    it('shows correct coursemate count when provided', () => {
        const coursemates = [
            { id: 1, name: 'Alice A.', initial: 'A' },
            { id: 2, name: 'Bob B.', initial: 'B' },
        ];
        render(<SocialDiscoverWidget coursemates={coursemates} />);
        expect(screen.getByText(/2 coursemates/)).toBeTruthy();
    });

    it('shows module name when provided', () => {
        render(<SocialDiscoverWidget moduleName="CS3001 - Algorithms" />);
        expect(screen.getByText(/CS3001 - Algorithms/)).toBeTruthy();
    });

    it('shows default module text when no moduleName', () => {
        render(<SocialDiscoverWidget />);
        expect(screen.getByText(/your modules/)).toBeTruthy();
    });

    it('shows study tip when provided', () => {
        render(<SocialDiscoverWidget studyTip="Study in the morning!" />);
        expect(screen.getByText('Study in the morning!')).toBeTruthy();
    });

    it('shows default study tip when none provided', () => {
        render(<SocialDiscoverWidget />);
        expect(screen.getByText(/Your best focus windows/)).toBeTruthy();
    });

    it('shows not in societies message when no joined society', () => {
        useSocieties.mockReturnValue({ societies: [{ id: 1, name: 'Chess', is_member: false }], loading: false });
        render(<SocialDiscoverWidget />);
        expect(screen.getByText('Not in any societies yet')).toBeTruthy();
    });

    it('shows joined society when user is a member', () => {
        useSocieties.mockReturnValue({
            societies: [{ id: 1, name: 'Chess Club', is_member: true, member_count: 20 }],
            loading: false,
        });
        render(<SocialDiscoverWidget />);
        expect(screen.getByText('Chess Club')).toBeTruthy();
    });

    it('shows society with next_event meta', () => {
        useSocieties.mockReturnValue({
            societies: [{ id: 1, name: 'Drama Club', is_member: true, next_event: 'Tomorrow at 5pm' }],
            loading: false,
        });
        render(<SocialDiscoverWidget />);
        expect(screen.getByText('Tomorrow at 5pm')).toBeTruthy();
    });

    it('shows society with new_posts_count meta', () => {
        useSocieties.mockReturnValue({
            societies: [{ id: 1, name: 'Book Club', is_member: true, new_posts_count: 5 }],
            loading: false,
        });
        render(<SocialDiscoverWidget />);
        expect(screen.getByText('5 new posts')).toBeTruthy();
    });

    it('shows loading skeleton when loading is true', () => {
        useSocieties.mockReturnValue({ societies: [], loading: true });
        const { container } = render(<SocialDiscoverWidget />);
        // Skeleton elements should be rendered
        expect(container.querySelector('[class*="societyCard"]')).toBeTruthy();
    });

    it('renders Find study partners link', () => {
        render(<SocialDiscoverWidget />);
        expect(screen.getByText('Find study partners →')).toBeTruthy();
    });

    it('renders View all societies link', () => {
        render(<SocialDiscoverWidget />);
        expect(screen.getByText('View all societies →')).toBeTruthy();
    });

    it('shows society with fallback thumbnail initial', () => {
        useSocieties.mockReturnValue({
            societies: [{ id: 1, name: 'Zeta Society', is_member: true }],
            loading: false,
        });
        render(<SocialDiscoverWidget />);
        expect(screen.getByText('Z')).toBeTruthy();
    });

    it('shows society with cover_image', () => {
        useSocieties.mockReturnValue({
            societies: [{ id: 1, name: 'Photo Club', is_member: true, cover_image: 'https://example.com/cover.jpg' }],
            loading: false,
        });
        const { container } = render(<SocialDiscoverWidget />);
        const img = container.querySelector('img');
        expect(img).toBeTruthy();
        expect(img?.getAttribute('src')).toBe('https://example.com/cover.jpg');
    });
});
