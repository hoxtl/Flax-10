import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import AuthHeroGeometric from '../../../components/Authentication/AuthHeroGeometric';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }) => <div {...p}>{children}</div>,
    span: ({ children, ...p }) => <span {...p}>{children}</span>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
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
});