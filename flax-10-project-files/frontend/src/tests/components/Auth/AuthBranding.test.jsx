import { describe, it, expect, act } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthBrand, AuthFooter } from '../../../components/Auth/AuthBranding';

describe('AuthBrand', () => {
  it('renders brand name and tagline', () => {
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 900 });
    render(<AuthBrand />);
    expect(screen.getByText('STUDYFLAX')).toBeTruthy();
    expect(screen.getByText('Built for calm study.')).toBeTruthy();
  });

  it('returns null when window is too short', () => {
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 500 });
    const { container } = render(<AuthBrand />);
    expect(container.firstChild).toBeNull();
  });

  it('updates on resize event', () => {
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 900 });
    render(<AuthBrand />);
    expect(screen.getByText('STUDYFLAX')).toBeTruthy();
    // Simulate resize to short height
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 500 });
    fireEvent(window, new Event('resize'));
    // Component should now return null (no content)
    expect(screen.queryByText('STUDYFLAX')).toBeNull();
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
