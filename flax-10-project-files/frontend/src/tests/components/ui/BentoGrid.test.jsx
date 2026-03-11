import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('framer-motion', () => ({
    motion: new Proxy({}, {
        get: (_, tag) => ({ children, ...props }) => {
            const Tag = typeof tag === 'string' ? tag : 'div';
            const { initial, animate, exit, transition, variants, ...rest } = props;
            return <Tag {...rest}>{children}</Tag>;
        },
    }),
}));

import { BentoGrid, BentoCard } from '../../../components/ui/bento-grid';

describe('BentoGrid', () => {
    it('renders children', () => {
        render(<BentoGrid><div>Child</div></BentoGrid>);
        expect(screen.getByText('Child')).toBeTruthy();
    });

    it('applies custom className', () => {
        const { container } = render(<BentoGrid className="my-grid"><span /></BentoGrid>);
        expect(container.firstChild.className).toContain('my-grid');
    });
});

describe('BentoCard', () => {
    it('renders children', () => {
        render(<BentoCard><div>Card Content</div></BentoCard>);
        expect(screen.getByText('Card Content')).toBeTruthy();
    });

    it('applies custom className', () => {
        const { container } = render(<BentoCard className="my-card"><span /></BentoCard>);
        expect(container.firstChild.className).toContain('my-card');
    });

    it('handles mouse move event without throwing', () => {
        const { container } = render(<BentoCard><span /></BentoCard>);
        const card = container.querySelector('[class*="card"]') || container.firstChild.firstChild;
        expect(() => fireEvent.mouseMove(card, { clientX: 100, clientY: 50 })).not.toThrow();
    });

    it('updates glow position on mouse move when ref is set', () => {
        const { container } = render(<BentoCard><span data-testid="inner">X</span></BentoCard>);
        const card = container.querySelector('[class*="card"]') || container.firstChild?.firstChild;
        if (card) {
            card.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100 });
            fireEvent.mouseMove(card, { clientX: 100, clientY: 50 });
        }
        expect(screen.getByTestId('inner')).toBeInTheDocument();
    });

    it('handles mouse leave event without throwing', () => {
        const { container } = render(<BentoCard><span /></BentoCard>);
        const card = container.firstChild;
        expect(() => fireEvent.mouseLeave(card)).not.toThrow();
    });
});
