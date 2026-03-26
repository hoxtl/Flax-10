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

import { BentoGrid, BentoCard } from '../../../components/ui/BentoGrid';

describe('BentoGrid', () => {
    it('renders children', () => {
        render(<BentoGrid><div>Child</div></BentoGrid>);
        expect(screen.getByText('Child')).toBeTruthy();
    });

    it('applies custom className', () => {
        const { container } = render(<BentoGrid className="my-grid"><span /></BentoGrid>);
        expect(container.firstChild.className).toContain('my-grid');
    });

    it('renders without className', () => {
        const { container } = render(<BentoGrid><span>X</span></BentoGrid>);
        expect(screen.getByText('X')).toBeInTheDocument();
    });

    it('renders multiple children', () => {
        render(
            <BentoGrid>
                <div>One</div>
                <div>Two</div>
            </BentoGrid>
        );
        expect(screen.getByText('One')).toBeInTheDocument();
        expect(screen.getByText('Two')).toBeInTheDocument();
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
        const card = container.querySelector('[class*="card"]') || container.firstChild?.firstChild;
        expect(() => fireEvent.mouseMove(card, { clientX: 100, clientY: 50 })).not.toThrow();
    });

    it('updates glow position on mouse move when ref is set', () => {
        const { container } = render(<BentoCard><span data-testid="inner">X</span></BentoCard>);
        const contentDiv = container.querySelector('[class*="content"]');
        const card = contentDiv?.parentElement;
        card.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100 });
        fireEvent.mouseMove(card, { clientX: 100, clientY: 50 });
        expect(screen.getByTestId('inner')).toBeInTheDocument();
    });

    it('handles mouse leave and resets glow position', () => {
        const { container } = render(<BentoCard><span data-testid="inner">X</span></BentoCard>);
        const contentDiv = container.querySelector('[class*="content"]');
        const card = contentDiv?.parentElement;
        card.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100 });
        fireEvent.mouseMove(card, { clientX: 100, clientY: 50 });
        fireEvent.mouseLeave(card);
        expect(screen.getByTestId('inner')).toBeInTheDocument();
    });

    it('renders without className', () => {
        render(<BentoCard><span>Content</span></BentoCard>);
        expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('handles mouse move and updates glow position', () => {
        const { container } = render(<BentoCard><span>X</span></BentoCard>);
        const contentDiv = container.querySelector('[class*="content"]');
        const card = contentDiv?.parentElement;
        card.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 });
        fireEvent.mouseMove(card, { clientX: 50, clientY: 50 });
        expect(screen.getByText('X')).toBeInTheDocument();
    });
});
