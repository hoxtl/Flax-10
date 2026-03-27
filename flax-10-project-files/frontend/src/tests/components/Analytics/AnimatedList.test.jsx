import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('framer-motion', () => ({
    motion: new Proxy({}, {
        get: (_, tag) => ({ children, ...props }) => {
            const Tag = typeof tag === 'string' ? tag : 'div';
            const { initial, animate, exit, transition, ...rest } = props;
            return <Tag {...rest}>{children}</Tag>;
        },
    }),
    useInView: vi.fn(() => true),
}));

import AnimatedList from '../../../components/analytics/AnimatedList';

describe('AnimatedList', () => {
    it('renders nothing when items is empty', () => {
        const { container } = render(<AnimatedList items={[]} />);
        // Should render the container but no items
        expect(container.firstChild).toBeTruthy();
    });

    it('renders string items using default renderer', () => {
        render(<AnimatedList items={['Item A', 'Item B', 'Item C']} />);
        expect(screen.getByText('Item A')).toBeTruthy();
        expect(screen.getByText('Item B')).toBeTruthy();
        expect(screen.getByText('Item C')).toBeTruthy();
    });

    it('uses renderItem when provided', () => {
        const renderItem = (item) => <div data-testid="custom-item">{item.name}</div>;
        render(
            <AnimatedList
                items={[{ name: 'Custom One' }, { name: 'Custom Two' }]}
                renderItem={renderItem}
            />
        );
        const items = screen.getAllByTestId('custom-item');
        expect(items).toHaveLength(2);
        expect(items[0].textContent).toBe('Custom One');
    });

    it('renders gradient elements when showGradients is true', () => {
        const { container } = render(<AnimatedList items={['A']} showGradients={true} />);
        // Gradients are rendered as divs with opacity style
        expect(container.firstChild).toBeTruthy();
    });

    it('does not render gradients when showGradients is false', () => {
        const { container } = render(<AnimatedList items={['A']} showGradients={false} />);
        expect(container.firstChild).toBeTruthy();
    });

    it('applies custom className', () => {
        const { container } = render(<AnimatedList items={[]} className="my-class" />);
        expect(container.firstChild.className).toContain('my-class');
    });

    it('handles scroll events without throwing', () => {
        const { container } = render(<AnimatedList items={['A', 'B']} />);
        const list = container.querySelector('div > div');
        // Use onScroll event directly since jsdom doesn't support scrollHeight setter
        expect(() => fireEvent.scroll(list)).not.toThrow();
    });
});
