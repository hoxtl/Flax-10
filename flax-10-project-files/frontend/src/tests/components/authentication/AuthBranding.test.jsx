import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthBrand, AuthFooter } from '../../../components/Authentication/AuthBranding';

describe('AuthBrand', () => {
  it('renders brand name and tagline', () => {
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 900 });
    render(<AuthBrand />);
    expect(screen.getByText('STUDYFLAX')).toBeTruthy();
    expect(screen.getByText('Built for calm study.')).toBeTruthy();
  });
});

describe('AuthFooter', () => {
  it('renders footer text', () => {
    render(<AuthFooter />);
    expect(screen.getByText('Always secure · No ads · Free forever')).toBeTruthy();
  });

  it('applies base style when absolute is false (default)', () => {
    const { container } = render(<AuthFooter />);
    expect(container.firstChild.style.position).toBe('');
  });

  it('applies absolute style when absolute is true', () => {
    const { container } = render(<AuthFooter absolute={true} />);
    expect(container.firstChild.style.position).toBe('absolute');
  });
});