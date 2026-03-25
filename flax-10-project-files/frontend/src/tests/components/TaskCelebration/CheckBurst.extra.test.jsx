import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CheckBurst } from '../../components/TaskCelebration/CheckBurst';

describe('CheckBurst', () => {
    it('renders children', () => {
        render(<CheckBurst><button>Click me</button></CheckBurst>);
        expect(screen.getByText('Click me')).toBeTruthy();
    });

    it('renders 8 particles', () => {
        const { container } = render(<CheckBurst />);
        // The burst div contains 8 particle spans
        const burst = container.querySelector('[aria-hidden]');
        expect(burst).toBeTruthy();
        expect(burst.children.length).toBe(8);
    });

    it('applies active class when active is true', () => {
        const { container } = render(<CheckBurst active={true} />);
        const wrapper = container.firstChild;
        expect(wrapper.className).toContain('active');
    });

    it('does not apply active class when active is false', () => {
        const { container } = render(<CheckBurst active={false} />);
        const wrapper = container.firstChild;
        expect(wrapper.className).not.toContain('active');
    });

    it('applies custom className', () => {
        const { container } = render(<CheckBurst className="custom-class" />);
        const wrapper = container.firstChild;
        expect(wrapper.className).toContain('custom-class');
    });

    it('particles have correct CSS custom properties', () => {
        const { container } = render(<CheckBurst />);
        const burst = container.querySelector('[aria-hidden]');
        const firstParticle = burst.children[0];
        expect(firstParticle.style.getPropertyValue('--angle')).toBe('0deg');
        expect(firstParticle.style.getPropertyValue('--delay')).toBe('0s');
    });
});
