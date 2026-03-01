import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthBrand, AuthFooter } from '../../../components/Authentication/AuthBranding';

afterEach(() => {
  Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 1024 });
});

describe('AuthBrand', () => {
  it('renders brand name and tagline when window is tall enough', () => {
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 1024 });
    render(<AuthBrand />);
    expect(screen.getByText('STUDYFLAX')).toBeTruthy();
    expect(screen.getByText('Built for calm study.')).toBeTruthy();
  });

  it('returns null when window is not tall enough', () => {
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 });
    const { container } = render(<AuthBrand />);
    expect(container.firstChild).toBeNull();
  });

  it('updates visibility on resize', () => {
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 1024 });
    render(<AuthBrand />);
    expect(screen.getByText('STUDYFLAX')).toBeTruthy();
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 500 });
    fireEvent(window, new Event('resize'));
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