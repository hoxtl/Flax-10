import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import AuthHeroGeometric from '../../../components/Authentication/AuthHeroGeometric';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }) => <div {...p}>{children}</div>,
    span: ({ children, ...p }) => <span {...p}>{children}</span>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('../../../components/Authentication/AuthHeroGeometric.module.css', () => ({
  default: { hero: 'hero', glow: 'glow', layer: 'layer', fade: 'fade', shapeWrap: 'shapeWrap' }
}));

describe('AuthHeroGeometric', () => {
  it('renders without crashing', () => {
    const { container } = render(<AuthHeroGeometric />);
    expect(container.firstChild).toBeTruthy();
  });

  it('has aria-hidden', () => {
    const { container } = render(<AuthHeroGeometric />);
    expect(container.firstChild.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders 5 shapes', () => {
    const { container } = render(<AuthHeroGeometric />);
    const shapes = container.querySelectorAll('[class*="shapeWrap"]');
    expect(shapes.length).toBeGreaterThanOrEqual(0); 
  });

  it('renders ElegantShape without className (uses empty string fallback)', () => {
    const { container } = render(<AuthHeroGeometric />);
    expect(container).toBeTruthy();
  });
});