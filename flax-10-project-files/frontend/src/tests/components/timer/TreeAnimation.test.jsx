import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TreeAnimation from '../../../components/Timer/TreeAnimation';

// Mock the CSS module to avoid parsing errors in tests
vi.mock('../../../components/Timer/TreeAnimation.module.css', () => ({
    default: {
        container: 'container',
        scene: 'scene',
        svg: 'svg',
        brown: 'brown',
        green: 'green',
        red: 'red',
        pot: 'pot',
        soil: 'soil'
    }
}));

describe('TreeAnimation', () => {
    it('renders without crashing', () => {
        render(<TreeAnimation progress={0} mode="work" />);
        // It renders an SVG, so we can check for that or specific classes
        const svg = document.querySelector('svg');
        expect(svg).toBeInTheDocument();
    });

    it('calculates clip path based on progress', () => {
        const { rerender } = render(<TreeAnimation progress={50} mode="work" />);
        // We can't easily check the computed style of the clip-path in JSDOM easily for dynamic inline styles
        // but we can check if the logic helper was called if we exported or mocked it.
        // Or check the style attribute on the group.

        // The component logic: inset(${100 - progress}% 0 0 0)
        // 50% progress -> inset(50% 0 0 0)
        const group = document.querySelector('g');
        // Note: querySelector might find the first g, which is our clipped tree group
        expect(group).toHaveStyle({ clipPath: 'inset(50% 0 0 0)' });

        rerender(<TreeAnimation progress={100} mode="work" />);
        expect(group).toHaveStyle({ clipPath: 'inset(0% 0 0 0)' });

        rerender(<TreeAnimation progress={0} mode="work" />);
        // TreeAnimation clamps displayProgress to at least 15.
        // progress=0 => displayProgress=15 => percentHidden=85
        expect(group).toHaveStyle({ clipPath: 'inset(85% 0 0 0)' });
    });
});
