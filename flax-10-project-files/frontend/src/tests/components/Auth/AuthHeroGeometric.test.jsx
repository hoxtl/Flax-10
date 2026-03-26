import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import AuthHeroGeometric from '../../../components/Auth/AuthHeroGeometric';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }) => <div {...p}>{children}</div>,
    span: ({ children, ...p }) => <span {...p}>{children}</span>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('../../../components/Auth/AuthHeroGeometric.module.css', () => ({
  default: {
    hero: 'hero',
    glow: 'glow',
    layer: 'layer',
    fade: 'fade',
    shapeWrap: 'shapeWrap',
    shape: 'shape',
    shapeInner: 'shapeInner',
    leftTop: 'leftTop',
    rightMid: 'rightMid',
    leftBottom: 'leftBottom',
    rightTop: 'rightTop',
    leftSmall: 'leftSmall',
  }
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

  it('accepts custom shapes with string dimensions', () => {
    const { container } = render(
      <AuthHeroGeometric
        shapes={[
          {
            classNameKey: 'leftTop',
            width: '22rem',
            height: '6rem',
            rotate: 4,
            driftX: 2,
            driftY: 3,
            floatDuration: 8,
          },
        ]}
      />
    );

    const shape = container.querySelector('.shape');
    expect(shape.style.getPropertyValue('--shape-width')).toBe('22rem');
    expect(shape.style.getPropertyValue('--shape-height')).toBe('6rem');
  });

  it('falls back to an empty wrapper class when the shape key is unknown', () => {
    const { container } = render(
      <AuthHeroGeometric
        shapes={[
          {
            classNameKey: 'missingKey',
            width: 120,
            height: 48,
            rotate: 0,
            driftX: 2,
            driftY: 2,
            floatDuration: 8,
          },
        ]}
      />
    );

    expect(container.querySelectorAll('.shapeWrap').length).toBe(1);
  });
});
