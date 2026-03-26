import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SocietiesSkeleton, SocietyDetailSkeleton } from '../../pages/societies/SocietySkeletons';

describe('SocietiesSkeleton', () => {
    it('renders the page skeleton with 8 card placeholders', () => {
        const { container } = render(<SocietiesSkeleton />);
        const cards = container.querySelectorAll('[class*="skelSocCard"]');
        expect(cards.length).toBe(8);
    });

    it('renders title skeleton', () => {
        const { container } = render(<SocietiesSkeleton />);
        expect(container.querySelector('[class*="skelPageTitle"]')).toBeTruthy();
    });
});

describe('SocietyDetailSkeleton', () => {
    it('renders hero skeleton', () => {
        const { container } = render(<SocietyDetailSkeleton />);
        expect(container.querySelector('[class*="skelHero"]')).toBeTruthy();
    });

    it('renders back button skeleton', () => {
        const { container } = render(<SocietyDetailSkeleton />);
        expect(container.querySelector('[class*="skelBackBtn"]')).toBeTruthy();
    });

    it('renders tab skeletons', () => {
        const { container } = render(<SocietyDetailSkeleton />);
        const tabs = container.querySelectorAll('[class*="skelTab"]');
        expect(tabs.length).toBeGreaterThan(0);
    });

    it('renders 3 body block skeletons', () => {
        const { container } = render(<SocietyDetailSkeleton />);
        const blocks = container.querySelectorAll('[class*="skelBlock"]');
        expect(blocks.length).toBe(3);
    });

    it('renders side panel skeleton', () => {
        const { container } = render(<SocietyDetailSkeleton />);
        expect(container.querySelector('[class*="skelSidePanel"]')).toBeTruthy();
    });
});
